/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  query,
  where,
  writeBatch,
  getDoc,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
  increment,
  collectionGroup,
  limit,
  deleteField,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { EventFormData } from "@/lib/validators";
import { Event } from "@/features/organization/events/types";
import {
  determineEventStatus,
  getEventsNeedingStatusUpdate,
} from "@/utils/eventStatusUtils";
import { getCurrentUserData } from "./users";
// import { getAuth } from "firebase/auth";
import { Member } from "@/features/organization/members/types";
import { cacheService, CACHE_DURATIONS } from "@/services/cacheService";
import { getOrgById } from "./organization";
import { getActiveTerm } from "./term";
import { recalculateFines } from "./fines/update/recalculate";
import { FineItem, ProofOfPayment } from "@/features/organization/fines/types";
import { updateFineStats } from "./stats/update/updateStats";
import { ClearanceStatus } from "@/features/organization/clearance/types";
import { getProofOfPaymentByUserId } from "./payment/read/proofOfPayment";
import { recalculateClearanceStatus } from "./clearance";

const eventsCollection = collection(db, "events");

// Helper to manage errors
const handleFirestoreError = (error: any, context: string) => {
  console.error(`Error ${context}:`, error);

  // If it's already an Error object with a message, preserve it
  if (error instanceof Error) {
    throw error;
  }

  // Otherwise, create a generic error
  throw new Error(`Failed to ${context}`);
};

// Helper to transform event data
const transformEventData = (doc: any): Event => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    date: data.date?.toDate ? data.date.toDate() : data.date,
  } as Event;
};

export interface PaginatedEvents {
  events: Event[];
  totalCount: number;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Get paginated events with server-side filtering, sorting, and caching
 */
export const getPaginatedEvents = async (
  status?: "ongoing" | "upcoming" | "completed" | "archived" | "all",
  sortField: string = "date",
  sortDirection: "asc" | "desc" = "desc",
  pageSize: number = 5,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null,
  searchQuery?: string,
  skip: number = 0,
  filterDate?: Date,
  selectedTerm?: { AY: string; semester: string } | null
): Promise<PaginatedEvents> => {
  try {
    const term = selectedTerm || await getActiveTerm();
    // Create a cache key based on the query parameters
    const datePart = filterDate
      ? filterDate.toISOString().split("T")[0]
      : "no-date";

    const cacheKey = `events:paginated:${status}:${sortField}-${sortDirection}:${pageSize}:${skip}:${datePart}:${term?.AY}-${term?.semester}`;

    return await cacheService.getOrFetch<PaginatedEvents>(
      cacheKey,
      async () => {
        // Get the current user's level access
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        const org = await getOrgById(currentUser.orgId!);
        if (!currentUser || !org || !term) {
          return {
            events: [],
            totalCount: 0,
            lastDoc: null,
            hasMore: false,
          };
        }
        const levelAccess = currentUser.accessLevel;
        // Base query - filter by non-deleted events
        let baseQuery = query(
          eventsCollection,
          where("isDeleted", "==", false),
          where("orgId", "==", currentUser.orgId),
          where("academicYear", "==", term!.AY),
          where("semester", "==", term!.semester)
        );

        // Apply filters based on levelAccess
        if (levelAccess === 1 && org?.programId) {
          baseQuery = query(baseQuery, where("accessLevelEvent", "==", 1), where("programId", "==", org.programId));
        } else if (levelAccess === 2 && org?.facultyId) {
          baseQuery = query(baseQuery, where("accessLevelEvent", "==", 2), where("facultyId", "==", org.facultyId));
        } else if (levelAccess === 3) {
          baseQuery = query(baseQuery, where("accessLevelEvent", "==", 3));
        }

        // // Add status filter if provided and not "all"
        if (status && status !== "all") {
          baseQuery = query(baseQuery, where("status", "==", status));
        }

        // Add date filter if provided
        // In Firestore, we need to filter by a specific day range
        if (filterDate) {
          // Start of the day
          const startDate = new Date(filterDate);
          startDate.setHours(0, 0, 0, 0);

          // End of the day
          const endDate = new Date(filterDate);
          endDate.setHours(23, 59, 59, 999);
          // Add date range filter
          baseQuery = query(
            baseQuery,
            where("date", ">=", Timestamp.fromDate(startDate)),
            where("date", "<=", Timestamp.fromDate(endDate))
          );
        }

        // Add sorting
        const sortFieldPath =
          sortField === "name" || sortField === "attendees"
            ? sortField
            : "date";
        const sortedQuery = query(
          baseQuery,
          orderBy(sortFieldPath, sortDirection)
        );

        // Get total count for pagination - this is an expensive operation
        // so we'll cache it separately with a longer TTL
        const countCacheKey = `events:count:${status}:${levelAccess}-${org.facultyId || org.programId || "all"}:${datePart}`;

        const totalCount = await cacheService.getOrFetch<number>(
          countCacheKey,
          async () => {
            const countSnapshot = await getCountFromServer(sortedQuery);
            return countSnapshot.data().count;
          },
          CACHE_DURATIONS.EVENTS * 2 // Cache counts for longer
        );

        // If there are no events, return early
        if (totalCount === 0) {
          return {
            events: [],
            totalCount: 0,
            lastDoc: null,
            hasMore: false,
          };
        }

        // Execute query - get all results for this query
        const snapshot = await getDocs(sortedQuery);
        const allEvents = snapshot.docs.map(transformEventData);

        // Manual pagination using skip and limit
        const events = allEvents.slice(skip, skip + pageSize);

        // Check if any events need status updates
        const eventsToUpdate = getEventsNeedingStatusUpdate(events);
        if (eventsToUpdate.length > 0) {
          await updateEventStatuses(eventsToUpdate);

          // If we're filtering by status, we need to refresh the data
          // to make sure we get accurate results
          if (status && status !== "all") {
            // Invalidate relevant caches
            cacheService.invalidateByPrefix(`events:paginated:${status}`);
            cacheService.invalidate(countCacheKey);

            // Recursive call to get fresh data
            return getPaginatedEvents(
              status,
              sortField,
              sortDirection,
              pageSize,
              startAfterDoc,
              searchQuery,
              skip,
              filterDate,
              selectedTerm
            );
          }
        }

        return {
          events,
          totalCount,
          lastDoc: null, // We're not using cursor pagination anymore
          hasMore: skip + pageSize < totalCount,
        };
      },
      CACHE_DURATIONS.EVENTS // Cache for 15 minutes by default
    );
  } catch (error) {
    handleFirestoreError(error, "fetch paginated events");
    return {
      events: [],
      totalCount: 0,
      lastDoc: null,
      hasMore: false,
    };
  }
};

export const addEvent = async (eventData: EventFormData) => {
  try {
    // Get the current user's faculty ID
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    const org = await getOrgById(currentUser.orgId!);
    const term = await getActiveTerm();
    if (!currentUser || !org) return [];

    const levelAccess = currentUser.accessLevel;

    if (levelAccess === 1 && (!org || !org.programId)) {
      console.error("User is Level 1 but has no programId.");
      return [];
    }

    if (levelAccess === 2 && (!org || !org.facultyId)) {
      console.error("User is Level 2 but has no facultyId.");
      return [];
    }

    // Validate that the event date is not in the past
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

    const eventDate = new Date(eventData.date);
    eventDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

    if (eventDate < currentDate) {
      throw new Error("Cannot create an event with a date in the past");
    }

    // Validate time ranges
    // 1. Time In Start should be before Time In End
    if (eventData.timeInStart && eventData.timeInEnd) {
      if (eventData.timeInStart >= eventData.timeInEnd) {
        throw new Error("Time In Start must be earlier than Time In End");
      }
    }

    if (eventData.timeOutStart && eventData.timeOutEnd) {
      // 2. Time Out Start should be before Time Out End
      if (eventData.timeOutStart && eventData.timeOutEnd) {
        if (eventData.timeOutStart >= eventData.timeOutEnd) {
          throw new Error("Time Out Start must be earlier than Time Out End");
        }
      }
    }

    if(eventData.timeInEnd && eventData.timeOutStart){
      // 3. Time In End should be before Time Out Start (Time In period should complete before Time Out begins)
      if (eventData.timeInEnd && eventData.timeOutStart) {
        if (eventData.timeInEnd > eventData.timeOutStart) {
          throw new Error(
            "Time In period must complete before Time Out period begins"
          );
        }
      }
    }

    let dynamicFields = {};

    if (levelAccess === 1 && org?.programId) {
      dynamicFields = { programId: org.programId };
    } else if (levelAccess === 2 && org?.facultyId) {
      dynamicFields = { facultyId: org.facultyId };
    }
    
    const status = determineEventStatus(eventData.date);
    const docRef = await addDoc(eventsCollection, {
      ...eventData,
      note: eventData.note || "",
      timeInStart: eventData.timeInStart || null,
      timeInEnd: eventData.timeInEnd || null,
      timeOutStart: eventData.timeOutStart || null,
      timeOutEnd: eventData.timeOutEnd || null,
      createdAt: Timestamp.now(),
      date: Timestamp.fromDate(eventData.date),
      attendees: 0,
      status,
      isDeleted: false,
      finesGenerated: false,  
      accessLevelEvent: levelAccess,
      manuallyCompleted: false,
      orgId: currentUser.orgId,
      academicYear: term!.AY,
      semester: term!.semester,
      ...dynamicFields,
    });

    // Invalidate all event caches after adding a new event
    cacheService.invalidateByPrefix("events:");

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, "add event");
  }
};

export const updateEvent = async (
  eventId: string,
  eventData: EventFormData
) => {
  try {
    // Validate time ranges (same validations as addEvent)
    // 1. Time In Start should be before Time In End
    if (eventData.timeInStart && eventData.timeInEnd) {
      if (eventData.timeInStart >= eventData.timeInEnd) {
        throw new Error("Time In Start must be earlier than Time In End");
      }
    }

    if (eventData.timeOutStart && eventData.timeOutEnd) {
      // 2. Time Out Start should be before Time Out End
      if (eventData.timeOutStart && eventData.timeOutEnd) {
        if (eventData.timeOutStart >= eventData.timeOutEnd) {
          throw new Error("Time Out Start must be earlier than Time Out End");
        }
      }
    }
    if(eventData.timeInEnd && eventData.timeOutStart){
    // 3. Time In End should be before Time Out Start (Time In period should complete before Time Out begins)
      if (eventData.timeInEnd && eventData.timeOutStart) {
        if (eventData.timeInEnd > eventData.timeOutStart) {
          throw new Error(
            "Time In period must complete before Time Out period begins"
          );
        }
      }
    }

    // Get current event to check if it belongs to the faculty and if it's archived
    const currentEvent = await getEventById(eventId);
    if (!currentEvent) {
      throw new Error(
        "Event not found or you don't have permission to update it"
      );
    }

    const eventDoc = doc(db, "events", eventId);

    // If event is archived, maintain archived status
    // Otherwise, determine status based on date
    const status =
      currentEvent?.status === "archived"
        ? "archived"
        : determineEventStatus(eventData.date);

    await updateDoc(eventDoc, {
      ...eventData,
      note: eventData.note || "",
      timeInStart: eventData.timeInStart || null,
      timeInEnd: eventData.timeInEnd || null,
      timeOutStart: eventData.timeOutStart || null,
      timeOutEnd: eventData.timeOutEnd || null,
      date: Timestamp.fromDate(eventData.date),
      status, // Set status automatically based on date
    });

    // Invalidate specific event cache and all paginated events
    cacheService.invalidate(`event:${eventId}`);
    cacheService.invalidateByPrefix("events:");
  } catch (error) {
    handleFirestoreError(error, `update event with ID ${eventId}`);
  }
};


export const disableFineGeneration = async (eventId: string) => {
  try {
    const eventDoc = doc(db, "events", eventId);
    await updateDoc(eventDoc, {
      finesGenerated: true,
    });
    // Invalidate specific event cache and any paginated events
    cacheService.invalidate(`event:${eventId}`);
    cacheService.invalidateByPrefix("events:");
  } catch (error) {
    handleFirestoreError(
      error,
      `disable fine generation for event with ID ${eventId}`
    );
  }
 }

export const incrementEventAttendees = async (eventId: string) => {
  try {
    const eventDoc = doc(db, "events", eventId);
    await updateDoc(eventDoc, {
      attendees: increment(1),
    });

    // Invalidate specific event cache and any paginated events
    cacheService.invalidate(`event:${eventId}`);
    cacheService.invalidateByPrefix("events:");
  } catch (error) {
    handleFirestoreError(
      error,
      `increment attendees for event with ID ${eventId}`
    );
  }
};

export const updateEventStatuses = async (
  events: Event[]
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    let updatesApplied = false;

    events.forEach((event) => {
      // Skip archived events - they stay archived
      if (event.status === "archived") return;
      if (event.manuallyCompleted) return; // Skip events manually marked as completed

      // Convert ID to string if it's a number
      const eventId =
        typeof event.id === "number" ? String(event.id) : event.id;
      const eventDoc = doc(db, "events", eventId);

      const newStatus = determineEventStatus(new Date(event.date));

      if (event.status !== newStatus) {
        batch.update(eventDoc, { status: newStatus });
        updatesApplied = true;
      }
    });

    // Only commit if there are actual updates
    if (updatesApplied) {
      await batch.commit();

      // Invalidate all event caches since statuses changed
      cacheService.invalidateByPrefix("events:");
    }

    return updatesApplied;
  } catch (error) {
    console.error("Error updating event statuses:", error);
    return false;
  }
};

/**
 * Get all events with caching, optionally filtered by status
 */
export const getEvents = async (
  status?: "ongoing" | "upcoming" | "completed",
  selectedTerm?: { AY: string; semester: string } | null
): Promise<Event[]> => {
  try {
    const term = selectedTerm || await getActiveTerm();
    // Create cache key based on status
    const cacheKey = `events:all:${status || "all"}:${term?.AY}-${term?.semester}`;

    return await cacheService.getOrFetch<Event[]>(
      cacheKey,
      async () => {
        // Get the current user's faculty ID
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        const org = await getOrgById(currentUser.orgId!);
        if (!currentUser || !org || !term) return [];

        const levelAccess = currentUser.accessLevel;

        let q = query(
          eventsCollection,
          where("isDeleted", "==", false),
          where("orgId", "==", currentUser.orgId),
          where("academicYear", "==", term!.AY),
          where("semester", "==", term!.semester)
        );

        if (levelAccess === 1 && org.programId) {
          q = query(q, where("accessLevelEvent", "==", 1));
        } else if (levelAccess === 2 && org.facultyId) {
          q = query(q, where("accessLevelEvent", "==", 2));
        } else if (levelAccess === 3) {
          q = query(q, where("accessLevelEvent", "==", 3));
        }

        if (status) {
          q = query(q, where("status", "==", status));
        }
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map(transformEventData);

        // Check for events that need status updates
        const eventsToUpdate = getEventsNeedingStatusUpdate(events);
        if (eventsToUpdate.length > 0) {
          const updatesApplied = await updateEventStatuses(eventsToUpdate);

          // If we're filtering by status and updates were applied, refetch to get accurate results
          if (status && updatesApplied) {
            // Invalidate cache
            cacheService.invalidate(cacheKey);

            return getEvents(status, selectedTerm);
          }
        }

        return events;
      },
      CACHE_DURATIONS.EVENTS
    );
  } catch (error) {
    handleFirestoreError(error, "fetch events");
    return []; // Return empty array on error
  }
};

export const getEventsByStatus = async (status: string, selectedTerm?: { AY: string; semester: string } | null) => {
  try {
    const term = selectedTerm || await getActiveTerm();
    // Create cache key based on status
    const cacheKey = `events:status:${status}:${term?.AY}-${term?.semester}`;

    return await cacheService.getOrFetch<Event[]>(
      cacheKey,
      async () => {
        // Get the current user's faculty ID
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        const org = await getOrgById(currentUser.orgId!);
        if (!currentUser || !org || !term) return [];

        const levelAccess = currentUser.accessLevel;

        const eventsRef = collection(db, "events");
        let q = query(
          eventsRef,
          where("status", "==", status),
          where("isDeleted", "==", false),
          where("orgId", "==", currentUser.orgId),
          where("academicYear", "==", term!.AY),
          where("semester", "==", term!.semester)
        );

        if (levelAccess === 1 && org.programId) {
          q = query(q, where("programId", "==", org.programId ?? ""));
        } else if (levelAccess === 2 && org.facultyId) {
          q = query(q, where("facultyId", "==", org.facultyId ?? ""));
        }
        const querySnapshot = await getDocs(q);

        const events: Event[] = [];
        querySnapshot.forEach((doc) => {
          events.push(transformEventData(doc));
        });

        return events;
      },
      CACHE_DURATIONS.EVENTS
    );
  } catch (error) {
    console.error("Error fetching events by status:", error);
    return [];
  }
};

export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    // Create cache key for this event
    const cacheKey = `event:${eventId}`;

    return await cacheService.getOrFetch<Event | null>(
      cacheKey,
      async () => {
        const eventDoc = doc(db, "events", eventId);
        const docSnap = await getDoc(eventDoc);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.isDeleted === false) {
            return transformEventData({ id: docSnap.id, data: () => data });
          }
        }
        return null;
      },
      CACHE_DURATIONS.EVENTS
    );
  } catch (error) {
    handleFirestoreError(error, `get event with ID ${eventId}`);
    return null;
  }
};

export const archiveEvent = async (eventId: string) => {
  try {
    // Verify the event belongs to the current faculty before archiving
    const currentEvent = await getEventById(eventId);
    if (!currentEvent) {
      throw new Error(
        "Event not found or you don't have permission to archive it"
      );
    }

    const eventDoc = doc(db, "events", eventId);
    await updateDoc(eventDoc, { status: "archived" });



    // Invalidate specific event cache and all paginated events
    cacheService.invalidate(`event:${eventId}`);
    cacheService.invalidateByPrefix("events:");
  } catch (error) {
    handleFirestoreError(error, `archive event with ID ${eventId}`);
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    // Verify the event belongs to the current faculty before deleting
    const currentEvent = await getEventById(eventId);
    if (!currentEvent) {
      throw new Error(
        "Event not found or you don't have permission to delete it"
      );
    }

    const eventDoc = doc(db, "events", eventId);
    await updateDoc(eventDoc, { isDeleted: true }); // Soft delete

    // If fines were generated for this event, we need to handle them accordingly
    if (currentEvent.finesGenerated) {
      const subCollectionGroupRef = collectionGroup(db, "fineItems");
      const q = query(subCollectionGroupRef, where("eventId", "==", eventId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No fineItems documents found.");
        return;
      }

      let batch = writeBatch(db);
      let operationCount = 0;
      const batchPromises = [];

      //helper variables to hold for updating fines and clearances after each queries
      const fineRef: { parent: string, fineItem: FineItem, isPaid: boolean, isWaived: boolean }[] = [];
      const clearancesToUpdate: { clearance: ClearanceStatus, fineItem: FineItem, parentFineId: string }[] = [];
      const payments: { proof: ProofOfPayment, refId:string }[] = [];

      //Archive all fineItems related to the event
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          isArchived: true,
          "metadata.isArchived": true,
          "metadata.updatedAt": Timestamp.now(),
        });
        operationCount++;

        fineRef.push({ parent: doc.ref.parent.parent?.id || "", fineItem: { id: doc.id, ...doc.data() } as FineItem, isPaid: doc.data().isPaid, isWaived: doc.data().isWaived });
       
        if (operationCount === 500) {
          batchPromises.push(batch.commit());
          batch = writeBatch(db);
          operationCount = 0;
        }
      });

      if (operationCount > 0) {
        batchPromises.push(batch.commit());
      }
      await Promise.all(batchPromises);
      console.log("Successfully updated all fineItem documents!");
      console.log(fineRef.length);
      
      batchPromises.length = 0;
      batch = writeBatch(db);
      operationCount = 0;

      // For each fineItem, if it's not paid or waived, we need to recalculate the fine and update stats.
      //If it's paid but not waived, we only update stats. 
      const batchPromises2 = [];
      for (const ref of fineRef) {
        let amount = ref.fineItem.amount;
        if (!ref.isPaid && !ref.isWaived) {
          batchPromises2.push(recalculateFines(ref.parent, 0, 0, true, amount));
          batchPromises2.push(updateFineStats(`${currentEvent.academicYear!}-${currentEvent.semester!}-${currentEvent.orgId}`, 0, 0, amount))
        }
        if (ref.isPaid && !ref.isWaived) {
          batchPromises2.push(updateDoc(doc(db, "stats", `${currentEvent.academicYear!}-${currentEvent.semester!}-${currentEvent.orgId}`), {
            totalCollectedFines: increment(0 - (amount)),
            totalFines: increment(0-(amount))
          }))
          amount = 0;
        }
          batch.update(doc(db, "fines", ref.parent), {
          fineItemsCount: increment(-1),
          accumulatedAmount: increment(0 - amount),
          "metadata.updatedAt": Timestamp.now(),
        });
        operationCount++;
        
        if (operationCount === 500) {
          batchPromises.push(batch.commit());
          batch = writeBatch(db);
          operationCount = 0;
        }

        const clearanceQuery = query(collection(db, "clearanceStatus"), where(`blockingItems.${ref.fineItem.id}`, "!=", null));
        const snapshot = await getDocs(clearanceQuery);
        clearancesToUpdate.push({ clearance: snapshot.docs[0].data() as ClearanceStatus, fineItem: ref.fineItem, parentFineId: ref.parent });
      }
      if (operationCount > 0) {
        console.log("committing",operationCount)
        batchPromises.push(batch.commit());
        batch = writeBatch(db);
        operationCount = 0;
      }
      await Promise.all(batchPromises2);

      //Remove the fineItem from any clearance blockingItems 
      for (const item of clearancesToUpdate) {
        const docRef = doc(db, "clearanceStatus", item.clearance.id);
        batch.update(docRef, {
          [`blockingItems.${item.fineItem.id}`]: deleteField(),
          updatedAt: Timestamp.now()
        })
        operationCount++;
        if (operationCount === 500) {
          batchPromises.push(batch.commit());
          batch = writeBatch(db);
          operationCount = 0;
        } 
        
        const snapshot = await getDocs(query(collection(db, "proofOfPayments"),
          where("orgId", "==", currentEvent.orgId), where("userId", "==", item.clearance.userId),
          where("academicYear", "==", currentEvent.academicYear), where("semester", "==", currentEvent.semester),limit(1)));
        if(snapshot.empty) continue;
        const proofOfPayment = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProofOfPayment));
        payments.push({ proof: proofOfPayment[0], refId: item.fineItem.id });

      }
      if (operationCount > 0) {
        batchPromises.push(batch.commit());
      }

      await Promise.all(batchPromises);
      console.log("Successfully updated all clearance documents!");

      batchPromises.length = 0;
      batch = writeBatch(db);
      operationCount = 0;

      //Separate to ensure clearances are updated before recalculation also because I did not use transaction method hehe
      for(const item of clearancesToUpdate){
        batchPromises.push(recalculateClearanceStatus(item.clearance.userId, { AY: currentEvent.academicYear, semester: currentEvent.semester }));
      }

      //Remove payments done from items but keep it as refundables under metadata in case of refund requests on ghost events due to deletion
      for (const payment of payments) {
        const paymentRef = doc(db, "proofOfPayments", payment.proof.id!);
        const paymentToRemove = payment.proof.metadata.items?.find(i => i.refId === payment.refId);

        if (paymentToRemove) {
          if (payment.proof.metadata.items!.length === 1) {
            batch.update(paymentRef, {
              "metadata.items": arrayRemove(paymentToRemove),
              "metadata.refundables": arrayUnion(paymentToRemove),
              isArchived: true,
            })
            operationCount++;
          }
          else {
            batch.update(paymentRef, {
              "metadata.items": arrayRemove(paymentToRemove),
              "metadata.refundables": arrayUnion(paymentToRemove)
            })
            operationCount++;
          }
          if (operationCount === 500) {
            batchPromises.push(batch.commit());
            batch = writeBatch(db);
            operationCount = 0;
          }
        }
      }
      if (operationCount > 0) {
        batchPromises.push(batch.commit());
      }

      await Promise.all(batchPromises);
      console.log("Successfully updated all payments!");

    }

    // Invalidate specific event cache and all paginated events
    cacheService.invalidate(`event:${eventId}`);
    cacheService.invalidateByPrefix("events:");
  } catch (error) {
    handleFirestoreError(error, `delete event with ID ${eventId}`);
  }
};

export const completeEvent = async (eventId: string) => { 
  try {
    const eventDoc = doc(db, "events", eventId);
    await updateDoc(eventDoc, { status: "completed", manuallyCompleted: true });

    // Invalidate specific event cache and all paginated events
    cacheService.invalidate(`event:${eventId}`);
    cacheService.invalidateByPrefix("events:");
  } catch (error) {
    console.error(`Error updating status for event ${eventId}:`, error);
  }
}

// Convenience methods with caching
export const getOngoingEvents = async (): Promise<Event[]> => {
  return (await getEvents("ongoing")) as Event[];
};

export const getUpcomingEvents = async (): Promise<Event[]> => {
  return (await getEvents("upcoming")) as Event[];
};

interface ProgramData {
  name: string;
  shortName: string;
  acronym: string;
  facultyId: string;
}