/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  CollectionReference,
  DocumentData,
  limit,
  startAfter,
  getCountFromServer,
  QueryConstraint,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { getCurrentUserData } from "./users";
import { Member, MemberData } from "@/features/organization/members/types";
import { getOrgById } from "./organization";
import { Organization } from "@/constants/types";

const usersCollection: CollectionReference<DocumentData> = collection(
  db,
  "users"
);

const handleFirestoreError = (error: any, context: string) => {
  console.error(`Error ${context}:`, error);
  throw new Error(`Failed to ${context}.`);
};

/**
 * Builds base constraints shared across all user queries.
 * Applies access-level scoping at the DB layer to avoid over-fetching.
 */
const buildBaseConstraints = (
  currentUserData: Member,
  org: Organization,
  programId?: string
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [
    where("isDeleted", "==", false),
    where("role", "==", "user"),
  ];
  
  // Scope to org level — prevents fetching all 9000+ students for scoped roles
  if (currentUserData.accessLevel === 1 && org.programId) {
    constraints.push(where("programId", "==", org.programId ?? ""));
  } else if (currentUserData.accessLevel === 2 && org.facultyId) {
    constraints.push(where("facultyId", "==", org.facultyId ?? ""));
  }

  // Additional program filter (only for accessLevel 3+, since 1 already pins programId)
  if (programId && programId !== "all" && currentUserData.accessLevel !== 1) {
    constraints.push(where("programId", "==", programId));
  }

  return constraints;
};

/**
 * Resolves sort field and direction from a sortBy string.
 */
const resolveSortParams = (
  sortBy: string
): { sortField: string; sortDirection: "asc" | "desc" } => {
  const sortMap: Record<string, { sortField: string; sortDirection: "asc" | "desc" }> = {
    "name-asc":  { sortField: "firstName",  sortDirection: "asc" },
    "name-desc": { sortField: "firstName",  sortDirection: "desc" },
    "id-asc":    { sortField: "studentId",  sortDirection: "asc" },
    "id-desc":   { sortField: "studentId",  sortDirection: "desc" },
    "date-asc":  { sortField: "createdAt",  sortDirection: "asc" },
    "date-desc": { sortField: "createdAt",  sortDirection: "desc" },
  };
  return sortMap[sortBy] ?? { sortField: "firstName", sortDirection: "asc" };
};

/**
 * Fetches paginated users with cursor-based pagination to minimize Firestore reads.
 *
 * PAGINATION STRATEGY:
 * - Uses cursor-based pagination (startAfter) — O(pageSize) reads per page, not O(page * pageSize).
 * - Count is only fetched when `needCount` is true (e.g., first load or filter change).
 * - Search uses Firestore range queries (>=, <=) instead of client-side filtering,
 *   keeping fetched docs as close to pageSize as possible even with 9000+ students.
 *
 * SEARCH NOTES:
 * - Detects if search is ID-based (contains digit) or name-based.
 * - Normalizes name search to Title Case to match stored format.
 * - Searches against `studentId` or `firstName` using prefix range queries.
 * - Composite index required: (isDeleted, role, [programId|facultyId?], searchField)
 *
 * @param options.pageSize      - Rows per page (default: 20)
 * @param options.lastDoc       - Last QueryDocumentSnapshot from previous page (cursor)
 * @param options.searchQuery   - Raw search string from input
 * @param options.programId     - Program filter ("all" = no filter)
 * @param options.sortBy        - Sort key string e.g. "name-asc"
 * @param options.needCount     - Whether to run getCountFromServer (expensive — only on first load / filter change)
 */
export const getPaginatedUsers = async (options: {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  searchQuery?: string;
  programId?: string;
  sortBy?: string;
  needCount?: boolean;
}) => {
  try {
    const {
      pageSize = 20,
      lastDoc = null,
      searchQuery = "",
      programId = "all",
      sortBy = "name-asc",
      needCount = false,
    } = options;

    const currentUserData = (await getCurrentUserData()) as unknown as Member;
    const org = await getOrgById(currentUserData.orgId!);
    const baseConstraints = buildBaseConstraints(currentUserData, org!,programId);
    const { sortField, sortDirection } = resolveSortParams(sortBy);

    // Normalize search term
    const isIdSearch = /\d/.test(searchQuery);
    const normalizedSearch = searchQuery.trim()
      ? isIdSearch
        ? searchQuery.trim()
        : searchQuery
            .trim()
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ")
      : "";

    const constraints: QueryConstraint[] = [...baseConstraints];

    if (normalizedSearch) {
      // Server-side prefix search — only touches matching docs, not all 9000+
      const searchField = isIdSearch ? "studentId" : "firstName";
      constraints.push(where(searchField, ">=", normalizedSearch));
      constraints.push(where(searchField, "<=", normalizedSearch + "\uf8ff"));
      constraints.push(orderBy(searchField, sortDirection));
    } else {
      constraints.push(orderBy(sortField, sortDirection));
    }

    // Count only when caller opts in (first load, filter change, etc.)
    let total = 0;
    if (needCount) {
      const countSnapshot = await getCountFromServer(
        query(usersCollection, ...constraints)
      );
      total = countSnapshot.data().count;
    }

    // Cursor-based pagination — no skipping, no re-fetching previous pages
    constraints.push(limit(pageSize));
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(usersCollection, ...constraints);
    const snapshot = await getDocs(q);

    const members = snapshot.docs.map((doc) => ({
      id: doc.id,
      member: { ...doc.data() },
    })) as unknown as MemberData[];

    return {
      members,
      total,
      // Return the raw cursor so the caller can pass it back on next page
      lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
      hasMore: snapshot.size === pageSize,
    };
  } catch (error) {
    handleFirestoreError(error, "fetch paginated users");
    return { members: [], total: 0, lastDoc: null, hasMore: false };
  }
};

/**
 * Fetches members scoped to the current user's org level.
 * Uses cursor-based pagination — never loads all 9000+ at once.
 * Call repeatedly with the returned `lastDoc` to load more.
 *
 * @param currentUserData - The authenticated user (determines access scope)
 * @param pageSize        - How many to load per call (default: 50)
 * @param lastDoc         - Cursor from previous call, or null for first page
 * @param needCount       - Whether to include total count (costs 1 extra aggregation read)
 */
export const getMembersOfAnOrg = async (
  currentUserData: Member,
  pageSize: number = 50,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  needCount: boolean = false
) => {
  try {
    const org = await getOrgById(currentUserData.orgId!);
    const baseConstraints = buildBaseConstraints(currentUserData, org!);
    const constraints: QueryConstraint[] = [
      ...baseConstraints,
      orderBy("firstName", "asc"),
    ];

    let total = 0;
    if (needCount) {
      const countSnapshot = await getCountFromServer(
        query(usersCollection, ...constraints)
      );
      total = countSnapshot.data().count;
    }

    constraints.push(limit(pageSize));
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(usersCollection, ...constraints);
    const snapshot = await getDocs(q);

    const members = snapshot.docs.map((doc) => ({
      id: doc.id,
      member: { ...doc.data() },
    })) as unknown as MemberData[];

    return {
      members,
      total,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
      hasMore: snapshot.size === pageSize,
    };
  } catch (error) {
    handleFirestoreError(error, "fetch members of an org");
    return { members: [], total: 0, lastDoc: null, hasMore: false };
  }
};

export const getAllMembersOfAnOrg = async (
  currentUserData: Member,
) => {
  try {
    const org = await getOrgById(currentUserData.orgId!);
    const baseConstraints = buildBaseConstraints(currentUserData, org!);
    const constraints: QueryConstraint[] = [
     ...baseConstraints,
      orderBy("firstName", "asc"),
    ];

    const q = query(usersCollection, ...constraints);
    const snapshot = await getDocs(q);

    const members = snapshot.docs.map((doc) => ({
      id: doc.id,
      member: { ...doc.data() },
    })) as unknown as MemberData[];

    return members;
  } catch (error) {
    handleFirestoreError(error, "fetch members of an org");
    return [];
  }
};

/**
 * getAllStudents — USE SPARINGLY.
 * This fetches ALL students with no pagination. For 9000+ records this is
 * expensive (9000+ reads per call). Only use for exports or bulk operations.
 * Prefer getPaginatedUsers for any UI-facing list.
 */
export const getAllStudents = async () => {
  try {
    const q = query(
      usersCollection,
      where("isDeleted", "==", false),
      where("role", "==", "user"),
      orderBy("studentId", "asc")
    );

    const snapshot = await getDocs(q);
    console.warn(
      `[getAllStudents] WARNING: fetched ${snapshot.size} documents. Use getPaginatedUsers for UI lists.`
    );

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      member: { ...doc.data() },
    })) as unknown as MemberData[];
  } catch (error) {
    handleFirestoreError(error, "fetch all students");
    return [];
  }
};
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { getAuth } from "firebase/auth";
// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   getDocs,
//   CollectionReference,
//   DocumentData,
//   limit,
//   startAfter,
//   getCountFromServer,
//   QueryConstraint,
// } from "firebase/firestore";
// import { db } from "./firebase.config";
// import { getCurrentUserData, getCurrentUserFacultyId } from "./users";
// import { Member, MemberData } from "@/features/organization/members/types";

// const usersCollection: CollectionReference<DocumentData> = collection(
//   db,
//   "users"
// );

// const handleFirestoreError = (error: any, context: string) => {
//   console.error(`Error ${context}:`, error);
//   // Re-throwing allows the calling UI to handle the failed state.
//   throw new Error(`Failed to ${context}.`);
// };

// /**
//  * Gets paginated users with server-side pagination to minimize Firestore reads
//  */
// export const getPaginatedUsers = async (options: {
//   page?: number;
//   pageSize?: number;
//   searchQuery?: string;
//   programId?: string;
//   sortBy?: string;
//   accessLevel?: number;
// }) => {
//   try {
//     const {
//       page = 1,
//       pageSize = 20,
//       searchQuery = "",
//       programId = "all",
//       sortBy = "name-asc",
//     } = options;

//     const currentUserData = (await getCurrentUserData()) as unknown as Member;
//     const baseConstraints: QueryConstraint[] = [
//       where("isDeleted", "==", false),
//       where("role", "==", "user"),
//     ];

//     const accessLevel = currentUserData.accessLevel;

//     if (accessLevel === 1) {
//       baseConstraints.push(where("programId", "==", currentUserData.programId ?? ""));
//     } else if (accessLevel === 2) {
//       baseConstraints.push(where("facultyId", "==", currentUserData.facultyId ?? ""));
//     }

//     // Determine sort field and direction
//     let sortField = "firstName";
//     let sortDirection: "asc" | "desc" = "asc";

//     if (sortBy === "name-desc") {
//       sortField = "firstName";
//       sortDirection = "desc";
//     } else if (sortBy === "id-asc") {
//       sortField = "studentId";
//       sortDirection = "asc";
//     } else if (sortBy === "id-desc") {
//       sortField = "studentId";
//       sortDirection = "desc";
//     } else if (sortBy === "date-asc") {
//       sortField = "createdAt";
//       sortDirection = "asc";
//     } else if (sortBy === "date-desc") {
//       sortField = "createdAt";
//       sortDirection = "desc";
//     }

//     // For searches, we need a special approach
//     if (searchQuery) {
//       // Build the base query for searching
//       let searchBaseQuery = query(
//         usersCollection,
//         ...baseConstraints
//       );

//       // Add program filter if specified
//       if (programId !== "all") {
//         searchBaseQuery = query(
//           searchBaseQuery,
//           where("programId", "==", programId)
//         );
//       }

//       // Add sorting
//       searchBaseQuery = query(
//         searchBaseQuery,
//         orderBy(sortField, sortDirection)
//       );

//       // For search, we'll use getCountFromServer first to get total matches
//       const countSnapshot = await getCountFromServer(searchBaseQuery);
//       const totalBeforeSearch = countSnapshot.data().count;

//       // Limit the number of documents we'll fetch for client-side filtering
//       // We'll use a reasonable limit to balance completeness vs performance
//       const searchLimit = Math.min(100, totalBeforeSearch);
//       searchBaseQuery = query(searchBaseQuery, limit(searchLimit));

//       // Execute search query
//       const searchSnapshot = await getDocs(searchBaseQuery);

//       // Process results for search
//       let members = searchSnapshot.docs.map((doc) => ({
//         id: doc.id,
//         member: { ...doc.data() },
//       }));

//       // Filter by search query client-side
//       const lowerSearchQuery = searchQuery.toLowerCase();
//       members = members.filter((member) => {
//         return (
//           member.member.firstName?.toLowerCase().includes(lowerSearchQuery) ||
//           member.member.lastName?.toLowerCase().includes(lowerSearchQuery) ||
//           member.member.email?.toLowerCase().includes(lowerSearchQuery) ||
//           member.member.studentId?.toLowerCase().includes(lowerSearchQuery)
//         );
//       });

//       // Update total for pagination
//       const total = members.length;

//       // Apply pagination to the filtered results
//       const startAt = (page - 1) * pageSize;
//       const endAt = Math.min(startAt + pageSize, members.length);

//       return {
//         members: members.slice(startAt, endAt),
//         total,
//       };
//     } else {
//       // Regular pagination without search
//       // Build base query for counting
//       let countQuery = query(
//         usersCollection,
//         ...baseConstraints
//       );

//       // Add program filter for count if needed
//       if (programId !== "all") {
//         countQuery = query(countQuery, where("programId", "==", programId));
//       }

//       // Use aggregation query for efficient counting
//       const countSnapshot = await getCountFromServer(countQuery);
//       const total = countSnapshot.data().count;

//       // Build data query with pagination
//       let dataQuery = query(
//         usersCollection,
//         ...baseConstraints
//       );

//       // Add program filter if specified
//       if (programId !== "all") {
//         dataQuery = query(dataQuery, where("programId", "==", programId));
//       }

//       // Add sorting
//       dataQuery = query(dataQuery, orderBy(sortField, sortDirection));

//       // Apply pagination limit
//       dataQuery = query(dataQuery, limit(pageSize));

//       // If we're not on the first page, we need to use startAfter
//       if (page > 1) {
//         // We'll need to get the last document from the previous page
//         let previousPageQuery = query(
//           usersCollection,
//           ...baseConstraints
//         );

//         // Add program filter if specified
//         if (programId !== "all") {
//           previousPageQuery = query(
//             previousPageQuery,
//             where("programId", "==", programId)
//           );
//         }

//         // Add sorting
//         previousPageQuery = query(
//           previousPageQuery,
//           orderBy(sortField, sortDirection)
//         );

//         // Get just enough documents to find the cursor
//         previousPageQuery = query(
//           previousPageQuery,
//           limit((page - 1) * pageSize)
//         );

//         const previousPageSnapshot = await getDocs(previousPageQuery);
//         const lastVisibleDoc =
//           previousPageSnapshot.docs[previousPageSnapshot.docs.length - 1];

//         if (lastVisibleDoc) {
//           // Use the last document as a cursor
//           dataQuery = query(dataQuery, startAfter(lastVisibleDoc));
//         }
//       }

//       // Execute the final query to get this page's data
//       const dataSnapshot = await getDocs(dataQuery);

//       // Transform results
//       const members = dataSnapshot.docs.map((doc) => ({
//         id: doc.id,
//         member: { ...doc.data() },
//       }));

//       return { members, total };
//     }
//   } catch (error) {
//     handleFirestoreError(error, "fetch paginated users");
//     return { members: [], total: 0 };
//   }
// };

// export const getAllStudents = async () => {
//   try {
//     const q = query(
//       usersCollection,
//       where("isDeleted", "==", false),
//       where("role", "==", "user"),
//       orderBy("studentId", "asc")
//     );

//     const snapshot = await getDocs(q);
//     return snapshot.docs.map((doc) => ({
//       id: doc.id,
//       member: { ...doc.data() },
//     })) as unknown as MemberData[];
//   } catch (error) {
//     handleFirestoreError(error, "fetch all students");
//     return [];
//   }
// };

// export const getMembersOfAnOrg = async (currentUserData: Member) => {
//   try {
//     const baseConstraints = [
//       where("isDeleted", "==", false),
//       where("role", "==", "user"),
//     ];

//     let q = query(
//       usersCollection,
//       ...baseConstraints
//     );

//     if(currentUserData.accessLevel == 1) {
//       q = query(q, where("programId", "==", currentUserData.programId));
//     }

//     if(currentUserData.accessLevel == 2) {
//       q = query(q, where("facultyId", "==", currentUserData.facultyId));
//     }


//     const snapshot = await getDocs(q);
//     console.log(`cost of getMembersOfAnOrg: ${snapshot.size} reads`);
//     return snapshot.docs.map((doc) => ({
//       id: doc.id,
//       member: { ...doc.data() },
//     })) as unknown as MemberData[];
//   } catch (error) {
//     handleFirestoreError(error, "fetch members of an org");
//     return [];
//   }
// };
