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
export const getDashboardAttendeeCount = async (): Promise<number> => {
  try {
    // Use cache with a specific key for this dashboard metric
    const cacheKey = `dashboard:total-attendees-count`;

    return await cacheService.getOrFetch<number>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        if (!currentUser) return 0;

        const accessLevel = currentUser.accessLevel;
        let eventsQuery = query(
          collection(db, "events"),
          where("isDeleted", "==", false)
        );

        if (accessLevel === 1) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 1), where("programId", "==", currentUser.programId));
        } else if (accessLevel === 2) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 2), where("facultyId", "==", currentUser.facultyId));
        } else if (accessLevel === 3) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 3));
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
  count = 5
): Promise<Event[]> => {
  try {
    // Use cache with a specific key for this dashboard section
    const cacheKey = `dashboard:upcoming-events:${count}`;

    return await cacheService.getOrFetch<Event[]>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        if (!currentUser) return [];

        const accessLevel = currentUser.accessLevel;

        // Create a query for upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let eventsQuery = query(
          collection(db, "events"),
          where("isDeleted", "==", false),
          where("date", ">=", Timestamp.fromDate(today))
        );

        if (accessLevel === 1) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 1), where("programId", "==", currentUser.programId));
        } else if (accessLevel === 2) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 2), where("facultyId", "==", currentUser.facultyId));
        } else if (accessLevel === 3) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 3));
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
  count = 5
): Promise<Event[]> => {
  try {
    // Use cache with a specific key for this dashboard section
    const cacheKey = `dashboard:ongoing-events:${count}`;

    return await cacheService.getOrFetch<Event[]>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        if (!currentUser) return [];

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
          where("date", ">=", Timestamp.fromDate(startOfDay)),
          where("date", "<=", Timestamp.fromDate(endOfDay))
        );

        if (accessLevel === 1) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 1), where("programId", "==", currentUser.programId));
        } else if (accessLevel === 2) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 2), where("facultyId", "==", currentUser.facultyId));

        } else if (accessLevel === 3) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 3));
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
  count = 5
): Promise<Event[]> => {
  try {
    // Use cache with a specific key for this dashboard section
    const cacheKey = `dashboard:events:${count}`;

    return await cacheService.getOrFetch<Event[]>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        if (!currentUser) return [];

        const accessLevel = currentUser.accessLevel;

        // Query for events
        let eventsQuery = query(
          collection(db, "events"),
          where("isDeleted", "==", false)
        );

        if (accessLevel === 1) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 1), where("programId", "==", currentUser.programId));
        } else if (accessLevel === 2) {
          eventsQuery = query(eventsQuery, where("accessLevelEvent", "==", 2), where("facultyId", "==", currentUser.facultyId));
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
  count = 10
): Promise<Member[]> => {
  try {
    // Use cache with a specific key for this dashboard section
    const cacheKey = `dashboard:recent-members:${count}`;

    return await cacheService.getOrFetch<Member[]>(
      cacheKey,
      async () => {
        const currentUser = (await getCurrentUserData()) as unknown as Member;
        if (!currentUser) return [];

        const accessLevel = currentUser.accessLevel;

        // Query for recently added members
        let membersQuery = query(
          collection(db, "users"),
          where("isDeleted", "==", false),
          where("role", "==", "user")
        );

        if (accessLevel === 1) {
          membersQuery = query(membersQuery, where("programId", "==", currentUser.programId ?? ""));
        } else if (accessLevel === 2) {
          membersQuery = query(membersQuery, where("facultyId", "==", currentUser.facultyId ?? ""));
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
export const getDashboardStats = async (): Promise<{
  totalStudents: number;
  totalEvents: number;
  totalAttendances: number;
  overallAttendanceRate: number;
  averageAttendance: number;
  peakAttendance: number;
  totalAbsences: number;
}> => {
  try {
    // Use cache with a specific key for dashboard stats
    const cacheKey = `dashboard:stats`;

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
        if (!currentUser) {
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
          where("role", "==", "user")
        );
        let eventsBaseQuery = query(
          collection(db, "events"),
          where("isDeleted", "==", false)
        );

        if (accessLevel === 1) {
          studentsBaseQuery = query(studentsBaseQuery, where("programId", "==", currentUser.programId ?? ""));
          eventsBaseQuery = query(eventsBaseQuery, where("accessLevelEvent", "==", 1), where("programId", "==", currentUser.programId ?? ""));
        } else if (accessLevel === 2) {
          studentsBaseQuery = query(studentsBaseQuery, where("facultyId", "==", currentUser.facultyId ?? ""));
          eventsBaseQuery = query(eventsBaseQuery, where("accessLevelEvent", "==", 2), where("facultyId", "==", currentUser.facultyId ?? ""));
        } else if (accessLevel === 3) {
          eventsBaseQuery = query(eventsBaseQuery, where("accessLevelEvent", "==", 3));
        }

        // Execute all count queries in parallel for efficiency
        const [studentsCount, eventsSnapshot, totalAttendances] =
          await Promise.all([
            // Get total students count
            getCountFromServer(studentsBaseQuery),
            // Get events with attendee counts
            getDocs(eventsBaseQuery),
            // Get total attendances count (reuse the dedicated function)
            getDashboardAttendeeCount(),
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
