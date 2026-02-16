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
} from "firebase/firestore";
import { db } from "./firebase.config";
import { getCurrentUserData, getCurrentUserFacultyId } from "./users";
import { Member } from "@/features/organization/members/types";

const usersCollection: CollectionReference<DocumentData> = collection(
  db,
  "users"
);

const handleFirestoreError = (error: any, context: string) => {
  console.error(`Error ${context}:`, error);
  // Re-throwing allows the calling UI to handle the failed state.
  throw new Error(`Failed to ${context}.`);
};

/**
 * Gets paginated users with server-side pagination to minimize Firestore reads
 */
export const getPaginatedUsers = async (options: {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  programId?: string;
  sortBy?: string;
  accessLevel?: number;
}) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      searchQuery = "",
      programId = "all",
      sortBy = "name-asc",
    } = options;

    const currentUserData = (await getCurrentUserData()) as unknown as Member;
    console.log(currentUserData)
    const baseConstraints: QueryConstraint[] = [
      where("isDeleted", "==", false),
      where("role", "==", "user"),
    ];

    const accessLevel = currentUserData.accessLevel;

    if (accessLevel === 1) {
      baseConstraints.push(where("programId", "==", currentUserData.programId ?? ""));
    } else if (accessLevel === 2) {
      console.log(currentUserData.facultyId)
      baseConstraints.push(where("facultyId", "==", currentUserData.facultyId ?? ""));
    }

    // Determine sort field and direction
    let sortField = "firstName";
    let sortDirection: "asc" | "desc" = "asc";

    if (sortBy === "name-desc") {
      sortField = "firstName";
      sortDirection = "desc";
    } else if (sortBy === "id-asc") {
      sortField = "studentId";
      sortDirection = "asc";
    } else if (sortBy === "id-desc") {
      sortField = "studentId";
      sortDirection = "desc";
    } else if (sortBy === "date-asc") {
      sortField = "createdAt";
      sortDirection = "asc";
    } else if (sortBy === "date-desc") {
      sortField = "createdAt";
      sortDirection = "desc";
    }

    // For searches, we need a special approach
    if (searchQuery) {
      // Build the base query for searching
      let searchBaseQuery = query(
        usersCollection,
        ...baseConstraints
      );

      // Add program filter if specified
      if (programId !== "all") {
        searchBaseQuery = query(
          searchBaseQuery,
          where("programId", "==", programId)
        );
      }

      // Add sorting
      searchBaseQuery = query(
        searchBaseQuery,
        orderBy(sortField, sortDirection)
      );

      // For search, we'll use getCountFromServer first to get total matches
      const countSnapshot = await getCountFromServer(searchBaseQuery);
      const totalBeforeSearch = countSnapshot.data().count;

      // Limit the number of documents we'll fetch for client-side filtering
      // We'll use a reasonable limit to balance completeness vs performance
      const searchLimit = Math.min(100, totalBeforeSearch);
      searchBaseQuery = query(searchBaseQuery, limit(searchLimit));

      // Execute search query
      const searchSnapshot = await getDocs(searchBaseQuery);

      // Process results for search
      let members = searchSnapshot.docs.map((doc) => ({
        id: doc.id,
        member: { ...doc.data() },
      }));

      // Filter by search query client-side
      const lowerSearchQuery = searchQuery.toLowerCase();
      members = members.filter((member) => {
        return (
          member.member.firstName?.toLowerCase().includes(lowerSearchQuery) ||
          member.member.lastName?.toLowerCase().includes(lowerSearchQuery) ||
          member.member.email?.toLowerCase().includes(lowerSearchQuery) ||
          member.member.studentId?.toLowerCase().includes(lowerSearchQuery)
        );
      });

      // Update total for pagination
      const total = members.length;

      // Apply pagination to the filtered results
      const startAt = (page - 1) * pageSize;
      const endAt = Math.min(startAt + pageSize, members.length);

      return {
        members: members.slice(startAt, endAt),
        total,
      };
    } else {
      // Regular pagination without search
      // Build base query for counting
      let countQuery = query(
        usersCollection,
        ...baseConstraints
      );

      // Add program filter for count if needed
      if (programId !== "all") {
        countQuery = query(countQuery, where("programId", "==", programId));
      }

      // Use aggregation query for efficient counting
      const countSnapshot = await getCountFromServer(countQuery);
      const total = countSnapshot.data().count;

      // Build data query with pagination
      let dataQuery = query(
        usersCollection,
        ...baseConstraints
      );

      // Add program filter if specified
      if (programId !== "all") {
        dataQuery = query(dataQuery, where("programId", "==", programId));
      }

      // Add sorting
      dataQuery = query(dataQuery, orderBy(sortField, sortDirection));

      // Apply pagination limit
      dataQuery = query(dataQuery, limit(pageSize));

      // If we're not on the first page, we need to use startAfter
      if (page > 1) {
        // We'll need to get the last document from the previous page
        let previousPageQuery = query(
          usersCollection,
          ...baseConstraints
        );

        // Add program filter if specified
        if (programId !== "all") {
          previousPageQuery = query(
            previousPageQuery,
            where("programId", "==", programId)
          );
        }

        // Add sorting
        previousPageQuery = query(
          previousPageQuery,
          orderBy(sortField, sortDirection)
        );

        // Get just enough documents to find the cursor
        previousPageQuery = query(
          previousPageQuery,
          limit((page - 1) * pageSize)
        );

        const previousPageSnapshot = await getDocs(previousPageQuery);
        const lastVisibleDoc =
          previousPageSnapshot.docs[previousPageSnapshot.docs.length - 1];

        if (lastVisibleDoc) {
          // Use the last document as a cursor
          dataQuery = query(dataQuery, startAfter(lastVisibleDoc));
        }
      }

      // Execute the final query to get this page's data
      const dataSnapshot = await getDocs(dataQuery);

      // Transform results
      const members = dataSnapshot.docs.map((doc) => ({
        id: doc.id,
        member: { ...doc.data() },
      }));

      return { members, total };
    }
  } catch (error) {
    handleFirestoreError(error, "fetch paginated users");
    return { members: [], total: 0 };
  }
};
