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
  orderBy,
  limit,
  DocumentData,
  CollectionReference,
  Query,
  startAfter,
  QueryConstraint,
  getCountFromServer,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { getAuth } from "firebase/auth";
import { getCurrentUserData, searchUserByStudentId } from "./users"; // Assuming this is optimized
import {
  AttendanceRecord,
  EventAttendance,
} from "@/features/organization/log-attendance/types";
// import { Member } from "@/features/organization/members/types";
import { incrementEventAttendees } from "./events";
import { SearchParams } from "@/features/organization/attendees/types";
import { Event } from "@/features/organization/dashboard/types";
import { cacheService } from "@/services/cacheService";
import { Member, MemberData } from "@/features/organization/members/types";
// --- Reusable Constants & Helpers ---

/**
 * A reusable reference to the 'eventAttendees' collection.
 * This avoids repeatedly calling collection() with the same arguments.
 */
const attendanceCollection: CollectionReference<DocumentData> = collection(
  db,
  "eventAttendees"
);

const eventsCollection: CollectionReference<DocumentData> = collection(
  db,
  "events"
);
/**
 * A centralized error handler to keep error logging consistent.
 * @param error - The caught error object.
 * @param context - A string describing the context where the error occurred.
 */
const handleFirestoreError = (error: unknown, context: string): void => {
  console.error(`Error ${context}:`, error);
  // Depending on the app's needs, you could also throw a new, more specific error
  // or send the error to a logging service like Sentry or Firebase Crashlytics.
};

// --- Optimized Firestore Functions ---

/**
 * Logs a user's time-in or time-out for a specific event.
 * Creates a new record or updates an existing one.
 * @param eventId - The ID of the event.
 * @param studentId - The ID of the student.
 * @param type - The type of log, either 'time-in' or 'time-out'.
 */
export const logAttendance = async ({
  eventId,
  studentId,
  type,
}: {
  eventId: string;
  studentId: string;
  type: "time-in" | "time-out";
}): Promise<void> => {
  const q = query(
    attendanceCollection,
    where("eventId", "==", eventId),
    where("userId", "==", studentId),
    limit(1) // We only expect one record, so limit the result.
  );

  try {
    const querySnapshot = await getDocs(q);
    const now = Timestamp.now();
    const student = await searchUserByStudentId(
      studentId
    );
    const currentUserData = await getCurrentUserData() as unknown as Member;
    if (querySnapshot.empty) {
      // Create a new attendance record if one doesn't exist.
      let remark = null;
      if(currentUserData.accessLevel === 1 && currentUserData.programId != student?.programId) {
          remark = "registered in different program"
      }
      else if(currentUserData.accessLevel === 2 && currentUserData.facultyId != student?.facultyId) {
        remark = "registered in different faculty"
      }
      if(remark) {
        await addDoc(attendanceCollection, {
          eventId,
          student: student == null ? "unknown" : student,
          userId: studentId,
          timeIn: type === "time-in" ? now : null,
          timeOut: type === "time-out" ? now : null,
          status: "partially present",
          remark
        });
      }
      else {
        await addDoc(attendanceCollection, {
          eventId,
          student: student == null ? "unknown" : student,
          userId: studentId,
          timeIn: type === "time-in" ? now : null,
          timeOut: type === "time-out" ? now : null,
          status: "partially present",
        });
      }
      
      await incrementEventAttendees(eventId);
    } else {
      // Update the existing record.
      const recordDoc = querySnapshot.docs[0];
      const existingData = recordDoc.data();
      const updateData: { [key: string]: any } = {};

      if (type === "time-in") {
        updateData.timeIn = now;
      } else {
        // type === "time-out"
        updateData.timeOut = now;
      }

      // Determine the new status based on both time-in and time-out fields.
      const hasTimeIn = type === "time-in" || existingData.timeIn;
      const hasTimeOut = type === "time-out" || existingData.timeOut;
      updateData.status =
        hasTimeIn && hasTimeOut ? "present" : "partially present";
      await updateDoc(doc(db, "eventAttendees", recordDoc.id), updateData);
    }

    // Invalidate related caches after successful update
    cacheService.invalidateByPrefix(`event-attendees:${eventId}`);
    cacheService.invalidateByPrefix(`recent-attendance:${eventId}`);
  } catch (error) {
    handleFirestoreError(
      error,
      `logging attendance for student ${studentId} in event ${eventId}`
    );
  }
};

/**
 * Fetches the 9 most recent attendance records for an event, enriched with valid student data.
 * Records are excluded if the student does not exist or does not belong to the current user's faculty.
 * @param eventId - The ID of the event.
 * @param type - The type of log to sort by ('time-in' or 'time-out').
 * @returns A promise that resolves to an array of recent, valid attendance records.
 */ 
export const getRecentAttendance = async (
  eventId: string,
  type: "time-in" | "time-out"
): Promise<EventAttendance[]> => {
  try {
    // Use cache with key that includes event ID and type
    const cacheKey = `recent-attendance:${eventId}:${type}`;

    return await cacheService.getOrFetch<EventAttendance[]>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        if (!currentUser) return [];

        const accessLevel = currentUser.accessLevel;

        if (accessLevel === 1 && !currentUser.programId) {
          console.error("User is Level 1 but has no programId.");
          return [];
        }

        if (accessLevel === 2 && !currentUser.facultyId) {
          console.error("User is Level 2 but has no facultyId.");
          return [];
        }

        const timestampField = type === "time-in" ? "timeIn" : "timeOut";

        const q = query(
            attendanceCollection,
            where("eventId", "==", eventId),
            where(timestampField, "!=", null),
            orderBy(timestampField, "desc"),
            limit(9)
          );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return [];

        // Map to the EventAttendance type
        return querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timeIn: data.timeIn?.toDate() ?? null,
            timeOut: data.timeOut?.toDate() ?? null,
          } as EventAttendance;
        });
      },
      30 * 60 * 1000 // 30 minute cache
    );
  } catch (error) {
    handleFirestoreError(
      error,
      `fetching recent attendance for event ${eventId}`
    );
    return [];
  }
};
export const checkLogAttendanceExist = async (
  eventId: string,
  studentId: string,
  type: "time-in" | "time-out"
) => {
  try {
    // Use cache with key that includes all parameters
    const cacheKey = `attendance-check:${eventId}:${studentId}:${type}`;

    return await cacheService.getOrFetch<boolean>(
      cacheKey,
      async () => {
        const q = query(
          attendanceCollection,
          where("eventId", "==", eventId),
          where("userId", "==", studentId),
          where(type === "time-in" ? "timeIn" : "timeOut", "!=", null)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
      },
      5 * 60 * 1000 // 5 minute TTL - shorter for attendance checks
    );
  } catch (error) {
    console.error("Error checking attendance log:", error);
    return false;
  }
};

const usersCollection = collection(db, "users");

/**
 * Searches users whose full name (firstName + lastName) contains the search query.
 * This is more flexible than a simple "starts-with" query.
 *
 * @param name - The search query string.
 * @returns A promise that resolves to an array of matching user IDs.
 */
export const searchStudentIdsByName = async (
  name: string
): Promise<string[]> => {
  const trimmedName = name.trim().toLowerCase();
  if (!trimmedName) {
    return [];
  }

  // Use cache with search term as key
  const cacheKey = `student-search:${trimmedName}`;

  return await cacheService.getOrFetch<string[]>(
    cacheKey,
    async () => {
      // Fetch all users to filter client-side - THIS IS EXPENSIVE
      // But necessary due to Firestore's limited text search capabilities
      const usersQuery = query(
        usersCollection,
        where("isDeleted", "==", false)
      );
      const snapshot = await getDocs(usersQuery);

      const matchingIds = snapshot.docs
        .filter((doc) => {
          const userData = doc.data();
          const fullName = `${userData.firstName || ""} ${
            userData.lastName || ""
          }`.toLowerCase();
          return fullName.includes(trimmedName);
        })
        .map((doc) => doc.id);

      return matchingIds;
    },
    2 * 60 * 60 * 1000 // 2 hours - names don't change often
  );
};

/**
 * Builds an array of Firestore query constraints for fetching attendance records.
 * @param eventId - The unique identifier for the event. This is a required filter.
 * @param currentUser - The authenticated user's data object.
 * @param programFilter - (Optional) The program ID to filter attendees by.
 * @returns An array of QueryConstraint objects to be used with a Firestore query.
 */
export const buildAttendanceQueryConstraints = (
  eventId: string,
  currentUser: Member,
  programFilter?: string,
  studentIds?: string[]
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [where("eventId", "==", eventId)];

  // const accessLevel = currentUser.accessLevel;

  // // Dynamically add a filter for either facultyId or programId based on accessLevel
  // if (accessLevel === 1) {
  //   constraints.push(where("student.programId", "==", currentUser.programId ?? ""));
  // } else if (accessLevel === 2) {
  //   constraints.push(where("student.facultyId", "==", currentUser.facultyId ?? ""));
  //   if (programFilter) {
  //     constraints.push(where("student.programId", "==", programFilter));
  //   }
  // }
  // Level 3 (Admin) sees all records for the event

  // If a list of student IDs is provided (e.g., from a separate search),
  // use a 'where in' clause for efficient filtering.
  if (studentIds && studentIds.length > 0) {
    // Firestore limits 'in' queries to a maximum of 30 values.
    const limitedIds = studentIds.slice(0, 30);
    constraints.push(where("student.studentId", "in", limitedIds));
  }

  return constraints;
};
export const getAttendanceRecord = async (
  eventId: string,
  pageSize: number,
  sort: { field: string; direction: "asc" | "desc" },
  cursor?: DocumentSnapshot,
  programFilter?: string,
  searchQuery?: SearchParams | null,
  isPageJump?: boolean // Add this parameter
): Promise<{
  records: EventAttendance[];
  total: number;
  nextCursor: DocumentSnapshot | null;
  cursors?: DocumentSnapshot[]; // Add this to return intermediate cursors
  recordsForPage?: Record<number, EventAttendance[]>; // Add this to return records for specific pages
}> => {
  try {
    // Get cached student IDs if doing a name search
    let studentIds: string[] | undefined = undefined;

    if (searchQuery?.type === "name" && searchQuery.query) {
      // Get IDs of students matching the name search
      studentIds = await searchStudentIdsByName(searchQuery.query);

      // If no matches found, return early with empty results
      if (studentIds.length === 0) {
        return { records: [], total: 0, nextCursor: null };
      }
    }

    const currentUser = (await getCurrentUserData()) as unknown as Member;
    if (!currentUser) {
      // Not logged in, return an empty result.
      return { records: [], total: 0, nextCursor: null };
    }

    // Build constraints based on the fetched user's data
    const baseConstraints = buildAttendanceQueryConstraints(
      eventId,
      currentUser,
      programFilter,
      studentIds
    );

    // Create a query to get the total count of documents matching the base filters.
    const countQuery = query(attendanceCollection, ...baseConstraints);
    const totalSnapshot = await getCountFromServer(countQuery);
    const total = totalSnapshot.data().count;

    // If there are no records at all, return early to avoid unnecessary processing.
    if (total === 0) {
      return { records: [], total: 0, nextCursor: null };
    }

    // Helper function to map front-end sort field names to their corresponding
    // paths in the Firestore document (e.g., 'firstName' -> 'student.firstName').
    const getFirestoreSortField = (field: string): string => {
      switch (field) {
        case "firstName":
          return `student.firstName`;
        case "studentId":
          return `student.studentId`;
        default:
          return field; // For fields like 'timeIn', which are at the top level.
      }
    };

    // Assemble the final query constraints for fetching the actual data.
    const queryConstraints: QueryConstraint[] = [
      ...baseConstraints,
      orderBy(getFirestoreSortField(sort.field), sort.direction),
      limit(pageSize),
    ];

    // If a cursor is provided (meaning we are fetching page 2 or beyond),
    // add the 'startAfter' constraint to begin fetching from the last document of the previous page.
    if (cursor) {
      queryConstraints.push(startAfter(cursor));
    }

    // When handling page jumps, replace PAGE_SIZE with pageSize
    if (isPageJump) {
      // For page jumps, we need to track all intermediate cursors
      const intermediateResults: Record<number, EventAttendance[]> = {};
      const intermediateCursors: DocumentSnapshot[] = [];

      // Execute the query to get all documents up to the desired page
      const dataQuery = query(attendanceCollection, ...queryConstraints);
      const querySnapshot = await getDocs(dataQuery);

      // Process all documents and track cursors for each page
      const allDocs = querySnapshot.docs;
      let currentPageDocs: DocumentSnapshot[] = [];
      let currentPageIndex = 1; // Pages are 1-indexed

      // Split documents into pages and collect cursors
      for (let i = 0; i < allDocs.length; i++) {
        const doc = allDocs[i];
        currentPageDocs.push(doc);

        // When we reach a page boundary, process the page
        // FIXED: Use pageSize instead of PAGE_SIZE
        if (currentPageDocs.length === pageSize || i === allDocs.length - 1) {
          // Convert docs to records for this page
          const pageRecords = currentPageDocs.map((doc) => {
            const data = doc.data();
            // FIXED: Check if data exists before accessing properties
            return {
              id: doc.id,
              ...data,
              // FIXED: Check if data exists
              timeIn: data?.timeIn?.toDate() ?? null,
              timeOut: data?.timeOut?.toDate() ?? null,
            } as EventAttendance;
          });

          // Store records for this page
          intermediateResults[currentPageIndex] = pageRecords;

          // Store cursor for the next page (last doc of current page)
          if (i < allDocs.length - 1) {
            intermediateCursors.push(
              currentPageDocs[currentPageDocs.length - 1]
            );
          }

          // Reset for next page
          currentPageDocs = [];
          currentPageIndex++;
        }
      }

      // Return all the cursors and records we've collected
      // FIXED: Use pageSize instead of PAGE_SIZE
      return {
        records:
          intermediateResults[Math.ceil(allDocs.length / pageSize)] || [],
        total,
        nextCursor: allDocs.length > 0 ? allDocs[allDocs.length - 1] : null,
        cursors: intermediateCursors,
        recordsForPage: intermediateResults,
      };
    }

    // Execute the final query to get the documents for the current page.
    const dataQuery = query(attendanceCollection, ...queryConstraints);
    const querySnapshot = await getDocs(dataQuery);

    // Store the raw documents for later use in determining the next cursor.
    const docs = querySnapshot.docs;

    // Map the raw Firestore documents to a clean array of EventAttendance objects.
    // This includes converting Firestore Timestamps to JavaScript Date objects.
    let records = docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timeIn: data.timeIn?.toDate() ?? null,
        timeOut: data.timeOut?.toDate() ?? null,
      } as EventAttendance;
    });

    // Apply search filtering
    if (searchQuery) {
      if (searchQuery.type === "id" && searchQuery.query) {
        // For ID searches, filter client-side
        records = records.filter((record) =>
          record.student?.studentId.toString().includes(searchQuery.query)
        );
      }
      // Name searches are already handled through studentIds before the query
    }

    // Determine the cursor for the next page.
    const nextCursor = docs.length === pageSize ? docs[docs.length - 1] : null;

    // Return the final data structure.
    return { records, total, nextCursor };
  } catch (error) {
    handleFirestoreError(error, `getting attendance for event ${eventId}`);
    return { records: [], total: 0, nextCursor: null };
  }
};

export const totalAttendeesForAllEvent = async (): Promise<number> => {
  try {
    // Use cache for this expensive operation
    const cacheKey = `attendees-all-events`;

    return await cacheService.getOrFetch<number>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as Member | null;
        if (!currentUser) {
          console.log("No current user found.");
          return 0;
        }

        // 1. Build the query to get events based on the user's level access.
        let eventsQuery: Query;
        const accessLevel = currentUser.accessLevel;

        if (accessLevel === 1) {
          eventsQuery = query(
            eventsCollection,
            where("accessLevelEvent", "==", 1)
          );
        } else if (accessLevel === 2) {
          eventsQuery = query(
            eventsCollection,
            where("accessLevelEvent", "==", 2)
          );
        } else if (accessLevel === 3) {
          eventsQuery = query(
            eventsCollection,
            where("accessLevelEvent", "==", 3)
          );
        } else {
          console.log("User has no defined level access.");
          return 0; // No context to query by.
        }

        // 2. Fetch all matching events in a single database call.
        const eventsSnapshot = await getDocs(eventsQuery);
        if (eventsSnapshot.empty) {
          return 0; // No events found.
        }

        // 3. Sum the 'attendees' from each event document.
        let totalAttendees = 0;
        eventsSnapshot.forEach((doc) => {
          // Use "reduce" for a more functional approach to summing
          const eventData = (doc.data() as unknown as Event);
          totalAttendees += eventData.attendees || 0; // Add count, defaulting to 0 if undefined
        });

        return totalAttendees;
      },
      30 * 60 * 1000 // 30 minute TTL - less frequent updates for this aggregate
    );
  } catch (error) {
    handleFirestoreError(error, `getting total attendees from events`);
    return 0;
  }
};

