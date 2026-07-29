/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { Event } from "@/features/organization/dashboard/types";
import { Member } from "@/features/organization/members/types";
import { getCurrentUserData } from "./users";
import { cacheService, CACHE_DURATIONS } from "@/services/cacheService";
import { determineEventStatus } from "@/utils/eventStatusUtils";
import { getStats } from "./stats/read/getStats";
import { fetchStats } from "./clearance";
import { getOrgById } from "./organization";
import { getActiveTerm } from "./term";
import { Term } from "@/constants/types";

// Helper to transform event data from Firestore to our Event type
const transformEventData = (doc: any): Event => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    date: data.date?.toDate ? data.date.toDate() : data.date,
  } as Event;
};

/**
 * Gets a count of total attendees across all events for the current user's context
 * Uses an efficient single aggregation query instead of fetching all events
 */
export const getDashboardAttendeeCount = async (selectedTerm?: { AY: string, semester: string } | null): Promise<number> => {
  try {
    const term = selectedTerm || await getActiveTerm();
    // Use cache with a specific key for this dashboard metric
    const cacheKey = `dashboard:total-attendees-count:${term?.AY}-${term?.semester}`;

    return await cacheService.getOrFetch<number>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        const org = await getOrgById(currentUser.orgId!);
        if (!currentUser || !org || !term) return 0;

        const accessLevel = currentUser.accessLevel;
        let eventsQuery = query(
          collection(db, "events"),
          where("isDeleted", "==", false),
          where("academicYear", "==", term!.AY),
          where("semester", "==", term!.semester)
        );

        if (accessLevel === 1 && org.programId) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 1), where("orgId", "==", currentUser.orgId), where("programId", "==", org.programId));
        } else if (accessLevel === 2 && org.facultyId) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 2), where("orgId", "==", currentUser.orgId), where("facultyId", "==", org.facultyId));
        } else if (accessLevel === 3) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 3), where("orgId", "==", currentUser.orgId));
        }

        // Use getCountFromServer to avoid fetching document data
        const countSnapshot = await getCountFromServer(eventsQuery);
        const totalEvents = countSnapshot.data().count;

        // If there are no events, return 0 early
        if (totalEvents === 0) return 0;

        // Now fetch minimal data to sum attendees
        const eventsSnapshot = await getDocs(eventsQuery);

        // Sum the attendees field from each event
        let totalAttendees = 0;
        eventsSnapshot.forEach((doc) => {
          const eventData = doc.data();
          totalAttendees += eventData.attendees || 0;
        });

        return totalAttendees;
      },
      CACHE_DURATIONS.EVENTS // Cache for 15 minutes
    );
  } catch (error) {
    console.error("Error getting dashboard attendee count:", error);
    return 0;
  }
};

/**
 * Gets dashboard-specific upcoming events with minimal fields
 * Optimized to fetch only what's needed for the dashboard
 */
export const getDashboardUpcomingEvents = async (
  count = 5,
  selectedTerm?: Term
): Promise<Event[]> => {
  try {
    const term = selectedTerm || await getActiveTerm();
    // Use cache with a specific key for this dashboard section
    const cacheKey = `dashboard:upcoming-events:${count}:${term?.AY}-${term?.semester}`;

    return await cacheService.getOrFetch<Event[]>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        const org = await getOrgById(currentUser.orgId!);
        if (!currentUser || !org) return [];

        const accessLevel = currentUser.accessLevel;

        // Create a query for upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let eventsQuery = query(
          collection(db, "events"),
          where("isDeleted", "==", false),
          where("orgId", "==", currentUser.orgId),
          where("academicYear", "==", term?.AY),
          where("semester", "==", term?.semester),
          where("date", ">=", Timestamp.fromDate(today))
        );

        if (accessLevel === 1 && org.programId) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 1), where("orgId", "==", currentUser.orgId), where("programId", "==", org.programId));
        } else if (accessLevel === 2 && org.facultyId) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 2), where("orgId", "==", currentUser.orgId), where("facultyId", "==", org.facultyId));
        } else if (accessLevel === 3) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 3), where("orgId", "==", currentUser.orgId));
        }

        eventsQuery = query(
          eventsQuery,
          orderBy("date", "asc"),
          limit(count)
        );

        const querySnapshot = await getDocs(eventsQuery);
        // Transform to our Event type
        return querySnapshot.docs.map(transformEventData);
      },
      CACHE_DURATIONS.EVENTS // Cache for 15 minutes
    );
  } catch (error) {
    console.error("Error getting dashboard upcoming events:", error);
    return [];
  }
};

/**
 * Gets dashboard-specific ongoing events with minimal fields
 * Optimized to fetch only what's needed for the dashboard
 */
export const getDashboardOngoingEvents = async (
  count = 5,
  selectedTerm?: Term
): Promise<Event[]> => {
  try {
    const term = selectedTerm || await getActiveTerm();
    // Use cache with a specific key for this dashboard section
    const cacheKey = `dashboard:ongoing-events:${count}:${term?.AY}-${term?.semester}`;

    return await cacheService.getOrFetch<Event[]>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        const org = await getOrgById(currentUser.orgId!);
        if (!currentUser || !org) return [];

        const accessLevel = currentUser.accessLevel;

        // Get today's date range for accurate filtering
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // Query for events that are happening today
        let eventsQuery = query(
          collection(db, "events"),
          where("isDeleted", "==", false),
          where("orgId", "==", currentUser.orgId),
          where("academicYear", "==", term?.AY),
          where("semester", "==", term?.semester),
          where("date", ">=", Timestamp.fromDate(startOfDay)),
          where("date", "<=", Timestamp.fromDate(endOfDay))
        );

        if (accessLevel === 1 && org.programId) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 1), where("orgId", "==", currentUser.orgId), where("programId", "==", org.programId));
        } else if (accessLevel === 2 && org.facultyId) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 2), where("orgId", "==", currentUser.orgId), where("facultyId", "==", org.facultyId));

        } else if (accessLevel === 3) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 3), where("orgId", "==", currentUser.orgId));
        }

        eventsQuery = query(eventsQuery, limit(count));

        const querySnapshot = await getDocs(eventsQuery);
        // Filter for only ongoing events (has ongoing status or is currently ongoing)
        const events = querySnapshot.docs.map(transformEventData);
        return events.filter((event) => {
          const status = determineEventStatus(new Date(event.date));
          return status === "ongoing";
        });
      },
      60 * 1000 // Cache for 1 minute since ongoing status changes frequently
    );
  } catch (error) {
    console.error("Error getting dashboard ongoing events:", error);
    return [];
  }
};


/**
 * Gets dashboard-specific ongoing events with minimal fields
 * Optimized to fetch only what's needed for the dashboard
 */
export const getDashboardEvents = async (
  count = 5,
  selectedTerm?: { AY: string, semester: string } | null
): Promise<Event[]> => {
  try {
    const term = selectedTerm || await getActiveTerm();
    // Use cache with a specific key for this dashboard section
    const cacheKey = `dashboard:events:${count}:${term?.AY}-${term?.semester}`;

    return await cacheService.getOrFetch<Event[]>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        const org = await getOrgById(currentUser.orgId!);
        if (!currentUser || !org || !term) return [];

        const accessLevel = currentUser.accessLevel;

        // Query for events
        let eventsQuery = query(
          collection(db, "events"),
          where("isDeleted", "==", false),
          where("orgId", "==", currentUser.orgId),
          where("academicYear", "==", term!.AY),
          where("semester", "==", term!.semester)
        );

        if (accessLevel === 1 && org.programId) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 1), where("programId", "==", org.programId));
        } else if (accessLevel === 2 && org.facultyId) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 2), where("facultyId", "==", org.facultyId));
        } else if (accessLevel === 3) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 3));
        }

        eventsQuery = query(eventsQuery, limit(count));

        const querySnapshot = await getDocs(eventsQuery);
        return querySnapshot.docs.map(transformEventData);
        
      },
      60 * 1000 // Cache for 1 minute since ongoing status changes frequently
    );
  } catch (error) {
    console.error("Error getting dashboard events:", error);
    return [];
  }
};



/**
 * Gets most recent members for the dashboard with minimal fields
 * Optimized to fetch only what's needed for the dashboard display
 */
export const getDashboardRecentMembers = async (
  count = 5
): Promise<Member[]> => {
  try {
    // Use cache with a specific key for this dashboard section
    const cacheKey = `dashboard:recent-members:${count}`;

    return await cacheService.getOrFetch<Member[]>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        const org = await getOrgById(currentUser.orgId!);
        if (!currentUser || !org) return [];

        const accessLevel = currentUser.accessLevel;

        // Query for recently added members
        let membersQuery = query(
          collection(db, "users"),
          where("isDeleted", "==", false),
          where("role", "==", "user")
        );

        if (accessLevel === 1 && org.programId) {
          membersQuery = query(membersQuery, where("programId", "==", org.programId ?? ""));
        } else if (accessLevel === 2 && org.facultyId) {
          membersQuery = query(membersQuery, where("facultyId", "==", org.facultyId ?? ""));
        }

        membersQuery = query(
          membersQuery,
          orderBy("createdAt", "desc"),
          limit(count)
        );

        const querySnapshot = await getDocs(membersQuery);
        // Transform to our Member type with only the needed fields for display
        return querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            studentId: data.studentId || "",
            programId: data.programId || "",
            yearLevel: data.yearLevel || 0,
            createdAt: data.createdAt,
          } as unknown as Member;
        });
      },
      CACHE_DURATIONS.USERS // Cache for 1 hour
    );
  } catch (error) {
    console.error("Error getting dashboard recent members:", error);
    return [];
  }
};

/**
 * Gets event and member count statistics for the dashboard
 */
export const getDashboardStats = async (selectedTerm?: { AY: string, semester: string } | null): Promise<{
  totalStudents: number;
  totalEvents: number;
  totalAttendances: number;
  overallAttendanceRate: number;
  averageAttendance: number;
  peakAttendance: number;
  totalAbsences: number;
}> => {
  try {
    const term = selectedTerm || await getActiveTerm();
    // Use cache with a specific key for dashboard stats
    const cacheKey = `dashboard:stats:${term?.AY}-${term?.semester}`;

    return await cacheService.getOrFetch<{
      totalStudents: number;
      totalEvents: number;
      totalAttendances: number;
      overallAttendanceRate: number;
      averageAttendance: number;
      peakAttendance: number;
      totalAbsences: number;
    }>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        const org = await getOrgById(currentUser.orgId!);
        if (!currentUser || !org || !term) {
          return {
            totalStudents: 0,
            totalEvents: 0,
            totalAttendances: 0,
            overallAttendanceRate: 0,
            averageAttendance: 0,
            peakAttendance: 0,
            totalAbsences: 0,
          };
        }

        const accessLevel = currentUser.accessLevel;

        // Base queries
        let studentsBaseQuery = query(
          collection(db, "users"),
          where("isDeleted", "==", false),
          where("role", "==", "user"),
          where("status", "==", "approved")
        );

        let eventsBaseQuery = query(
          collection(db, "events"),
          where("isDeleted", "==", false),
          where("academicYear", "==", term!.AY),
          where("semester", "==", term!.semester)
        );


        if (accessLevel === 1 && org.programId) {
          studentsBaseQuery = query(studentsBaseQuery, where("programId", "==", org.programId ?? ""));
          eventsBaseQuery = query(eventsBaseQuery, where("accessLevelEvent", "==", 1), where("orgId", "==", currentUser.orgId), where("programId", "==", org.programId ?? ""));
        } else if (accessLevel === 2 && org.facultyId) {
          studentsBaseQuery = query(studentsBaseQuery, where("facultyId", "==", org.facultyId ?? ""));
          eventsBaseQuery = query(eventsBaseQuery, where("accessLevelEvent", "==", 2), where("orgId", "==", currentUser.orgId), where("facultyId", "==", org.facultyId ?? ""));
        } else if (accessLevel === 3) {
          eventsBaseQuery = query(eventsBaseQuery, where("accessLevelEvent", "==", 3), where("orgId", "==", currentUser.orgId),);
        }

        // Execute all count queries in parallel for efficiency
        const [studentsCount, eventsSnapshot, totalAttendances] =
          await Promise.all([
            // Get total students count
            getCountFromServer(studentsBaseQuery),
            // Get events with attendee counts
            getDocs(eventsBaseQuery),
            // Get total attendances count (reuse the dedicated function)
            getDashboardAttendeeCount(term),
          ]);
        const totalStudents = studentsCount.data().count;
        const totalEvents = eventsSnapshot.size;

        // Calculate event attendance statistics
        let peakAttendance = 0;

        // Find peak attendance
        eventsSnapshot.forEach((doc) => {
          const attendees = doc.data().attendees || 0;
          if (attendees > peakAttendance) {
            peakAttendance = attendees;
          }
        });

        // Handle case with no events or students to avoid division by zero
        if (totalEvents === 0 || totalStudents === 0) {
          return {
            totalStudents,
            totalEvents,
            totalAttendances: 0,
            overallAttendanceRate: 0,
            averageAttendance: 0,
            peakAttendance: 0,
            totalAbsences: 0,
          };
        }

        // Calculate the total possible attendances
        const totalPossibleAttendances = totalEvents * totalStudents;

        // Calculate overall attendance rate
        const overallAttendanceRate =
          (totalAttendances / totalPossibleAttendances) * 100;

        // Calculate average attendance per event
        const averageAttendance = totalAttendances / totalEvents;

        // Calculate total absences
        const totalAbsences = totalPossibleAttendances - totalAttendances;

        return {
          totalStudents,
          totalEvents,
          totalAttendances,
          overallAttendanceRate: parseFloat(overallAttendanceRate.toFixed(1)),
          averageAttendance: parseFloat(averageAttendance.toFixed(1)),
          peakAttendance,
          totalAbsences,
        };
      },
      5 * 60 * 1000 // Cache for 5 minutes
    );
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return {
      totalStudents: 0,
      totalEvents: 0,
      totalAttendances: 0,
      overallAttendanceRate: 0,
      averageAttendance: 0,
      peakAttendance: 0,
      totalAbsences: 0,
    };
  }
};

// Recent Payments
export const getDashboardRecentPayments = async (count = 5, selectedTerm?: { AY: string, semester: string } | null) => {
  try {
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    if (!currentUser) return [];

    const orgId = (currentUser as any).orgId ?? "";
    const term = selectedTerm || await getActiveTerm();
    if (!term) return [];

    const paymentsQuery = query(
      collection(db, "proofOfPayments"),
      where("orgId", "==", orgId),
      where("isArchived", "==", false),
      where("academicYear", "==", term!.AY),
      where("semester", "==", term!.semester),
      orderBy("submittedAt", "desc"),
      limit(count)
    );

    const snapshot = await getDocs(paymentsQuery);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userName: data.userName ?? "",
        studentId: data.studentId ?? "",
        amount: data.amount ?? 0,
        status: data.status ?? "pending",      
        paymentMethod: data.paymentMethod ?? "",
        paymentType: data.paymentType ?? "",    
        receiptCode: data.receiptCode ?? "",
        referenceNumber: data.referenceNumber ?? "",
        submittedAt: data.submittedAt ?? null,
        // items nested under metadata
        items: (data.metadata?.items ?? []) as Array<{
          title: string;
          amount: number;
          paymentType: string;
        }>,
      };
    });
  } catch (error) {
    console.error("Error getting dashboard recent payments:", error);
    return [];
  }
};

// Fees Collected
// Scoped to current org, excludes archived, sums paidAmount
export const getDashboardFeesCollected = async (selectedTerm?: { AY: string, semester: string } | null) => {
  try {
    const term = selectedTerm || await getActiveTerm();
    if (!term) return 0;
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    if (!currentUser) return 0;
    // const orgId = (currentUser as any).id ?? "";
    const stats = await getStats(`${term!.AY}-${term!.semester}-${currentUser.orgId}`); 
    return stats?.totalCollectedFees ?? 0;
  } catch (error) {
    console.error("Error getting fees collected:", error);
    return 0;
  }
};

// Unpaid Fines Amount
// Scoped to current org, excludes archived, sums balance of fines per student incl partial payments
export const getDashboardUnpaidFinesAmount = async (selectedTerm?: { AY: string, semester: string } | null) => {
  try {
    const term = selectedTerm || await getActiveTerm();
    if (!term) return 0;
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    if (!currentUser) return 0;
  //   const orgId = (currentUser as any).id ?? "";
    const stats = await getStats(`${term!.AY}-${term!.semester}-${currentUser.orgId}`);
    return stats?.totalUnpaidFines ?? 0;
  } catch (error) {
    console.error("Error getting unpaid fines amount:", error);
    return 0;
  }
};

// Clearance Rate
export const getDashboardClearanceRate = async (selectedTerm?: Term) => {
  try {
    const term = selectedTerm || await getActiveTerm();
    if (!term) return 0;
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    if (!currentUser) return 0;
    const clearanceStat = await fetchStats(currentUser.orgId!, term)
    const total = (clearanceStat?.cleared || 0) + (clearanceStat?.not_cleared || 0) + (clearanceStat?.pending || 0);
    return (total > 0 && total <= 100) ? ((clearanceStat?.cleared || 0) / total) * 100 : total > 100 ? ((clearanceStat?.cleared || 0) / total) : 0;
    
  }catch (error) {
    console.error("Error getting clearance rate:", error);
    return 0;
  }
  // try {
  //   const currentUser = (await getCurrentUserData()) as unknown as Member;
  //   if (!currentUser) return 0;

  //   const orgId = (currentUser as any).id ?? "";

  //   const clearanceSnapshot = await getDocs(query(
  //     collection(db, "clearanceStatus"),
  //     where("orgId", "==", orgId)
  //   ));

  //   let cleared = 0;
  //   let total = 0;
  //   clearanceSnapshot.forEach(doc => {
  //     total += 1;
  //     if (doc.data().status === "cleared") cleared += 1;
  //   });
  //   return total > 0 ? cleared / total : 0;
  // } catch (error) {
  //   console.error("Error getting clearance rate:", error);
  //   return 0;
  // }
  return 0;
};