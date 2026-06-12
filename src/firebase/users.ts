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
  getDoc,
  CollectionReference,
  DocumentData,
  orderBy,
  limit,
  documentId,
  writeBatch,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase.config";
import { MemberFormData } from "@/lib/validators";
import { Member, Program } from "@/features/organization/members/types";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getProgramById } from "./programs";
import {
  getCacheKey,
  getMembersCacheEntry,
  updateMembersCache,
} from "@/features/organization/members/services/membersCache";
import { getOrgById } from "./organization";
import { getActiveTerm } from "./term";

// Define the collection reference once at the top level for reuse.
const usersCollection: CollectionReference<DocumentData> = collection(
  db,
  "users"
);

interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

// Centralized error handler
const handleFirestoreError = (error: any, context: string) => {
  console.error(`Error ${context}:`, error);
  // Re-throwing allows the calling UI to handle the failed state.
  throw new Error(`Failed to ${context}.`);
};

/**
 * Fetches the facultyId for the currently authenticated user.
 * A private helper function to avoid code duplication in search functions.
 * @param uid - The user ID of the currently authenticated user.
 * @returns The facultyId string or null if not found or an error occurs.
 */
export const getCurrentUserFacultyId = async (
  uid: string
): Promise<string | null> => {
  if (!uid) {
    console.error("No user ID provided to fetch faculty ID.");
    return null;
  }
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    console.error("Authenticated user's document not found.");
    return null;
  }

  const facultyId = userDocSnap.data()?.facultyId;
  if (!facultyId) {
    return "";
  }
  return facultyId;
};

const waitForAuth = (): Promise<User | null> => {
  const auth = getAuth();
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe(); // Unsubscribe immediately after getting the initial state
        resolve(user);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export const getCurrentUserCount = async () => {
  try {
    const currentUser = await getCurrentUserData() as unknown as Member;
    const org = await getOrgById(currentUser.orgId!);
    if (currentUser.accessLevel === 1 && org?.programId){
      const querySnapshot = query(
          usersCollection,
          where("programId", "==", org.programId ?? ""),
          where("isDeleted", "==", false),
          where("role", "==", "user")
        );
      return (await getCountFromServer(querySnapshot)).data().count;
    } else if (currentUser.accessLevel === 2 && org?.facultyId) {
      const querySnapshot = query(
          usersCollection,
          where("facultyId", "==", org.facultyId ?? ""),
          where("isDeleted", "==", false),
          where("role", "==", "user")
      );
      return (await getCountFromServer(querySnapshot)).data().count;
    }
    else {
      const querySnapshot = query(
        usersCollection,
        where("isDeleted", "==", false),
        where("role", "==", "user")
      );
      return (await getCountFromServer(querySnapshot)).data().count;
    }
    
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Fetches the complete user document for the currently authenticated user.
 * This safely waits for Firebase Auth state to resolve before fetching.
 * @returns The user's data object or null if not found.
 */
export const getCurrentUserData = async () => {
  try {
    const currentUser = await waitForAuth();

    if (!currentUser) {
      console.warn("No user is currently authenticated.");
      return null;
    }
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.error("Authenticated user's document not found in Firestore.");
      return null;
    }
    const data = { uid: userDocSnap.data().id, ...userDocSnap.data() } as any;
    return data;
    

  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};
export const getCurrentUser = async (uid: string) => {
  if (!uid) {
    console.error("No user is currently authenticated.");
    return null;
  }
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    console.error("Authenticated user's document not found.");
    return null;
  }
  return {
    name: userDocSnap.data().name,
    email: userDocSnap.data().email,
  } as unknown as UserData;
};

// --- EXPORTED FUNCTIONS ---
/**
 * Fetches users based on the current user's context (faculty or program).
 */
export const getUsers = async () => {
  try {
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    if (!currentUser) return [];

    const accessLevel = currentUser.accessLevel;
    const org = await getOrgById(currentUser.orgId!);

    let usersQuery = query(
      usersCollection,
      where("isDeleted", "==", false),
      where("role", "==", "user")
    );

    if (accessLevel === 1 && org) {
      usersQuery = query(usersQuery, where("programId", "==", org.programId ?? ""));
    } else if (accessLevel === 2 && org) {
      usersQuery = query(usersQuery, where("facultyId", "==", org.facultyId ?? ""));
    }

    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      member: { ...doc.data() },
    }));
  } catch (error) {
    handleFirestoreError(error, "fetch users");
    return [];
  }
};

/**
 * Fetches all users 
 */
export const getAllUsers = async () => {
  try {
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    const org = await getOrgById(currentUser.orgId!);

    let usersQuery = query(
      usersCollection,
      where("isDeleted", "==", false),
      where("role", "==", "user")
    );


    if (currentUser.accessLevel === 1 && org) {
      usersQuery = query(usersQuery, where("programId", "==", org.programId ?? ""));
    } else if (currentUser.accessLevel === 2 && org) {
      usersQuery = query(usersQuery, where("facultyId", "==", org.facultyId ?? ""));
    }

    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      member: { ...doc.data() },
    }));
  } catch (error) {
    handleFirestoreError(error, "fetch users");
    return [];
  }
};

export const getRecentUsers = async () => {
  try {
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    if (!currentUser) return [];

    const accessLevel = currentUser.accessLevel;
    const org = await getOrgById(currentUser.orgId!);

    let recentUsersQuery = query(
      usersCollection,
      where("role", "==", "user"),
      where("isDeleted", "==", false)
    );

    if (accessLevel === 1 && org) {
      recentUsersQuery = query(recentUsersQuery, where("programId", "==", org.programId ?? ""));
    } else if (accessLevel === 2 && org) {
      recentUsersQuery = query(recentUsersQuery, where("facultyId", "==", org.facultyId ?? ""));
    }

    recentUsersQuery = query(recentUsersQuery, orderBy("createdAt", "desc"), limit(5));
    const querySnapshot = await getDocs(recentUsersQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      member: { ...doc.data() },
    }));
  } catch (error) {
    handleFirestoreError(error, "fetch recent users");
    return [];
  }
};

export const checkStudentIdExist = async (studentId: string) => {
  try {
    const querySnapshot = await getDocs(
      query(
        usersCollection,
        where("studentId", "==", studentId),
        where("isDeleted", "==", false)
      )
    );
    return !querySnapshot.empty;
  } catch (error) {
    handleFirestoreError(error, "check student ID existence");
    return false;
  }
};

export const addUser = async (userData: MemberFormData) => {
  try {
    if (await checkStudentIdExist(userData.studentId)) {
      throw new Error("Student ID already exists.");
    }
    if (userData == null) {
      throw new Error("No user data provided for addition.");
    }
    if (userData.yearLevel === undefined) {
      userData.yearLevel = 0;
    }
    if (userData.facultyId === "" || userData.facultyId == null) {
      userData.facultyId =
        ((await getProgramById(userData.programId)) as Program | null)
          ?.facultyId || "";
    }
    const docRef = await addDoc(usersCollection, {
      ...userData,
      createdAt: Timestamp.now(),
      isDeleted: false,
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, "add user");
  }
};

export const updateUser = async (userId: string, userData: MemberFormData) => {
  try {
    if (userData == null) {
      throw new Error("No user data provided for update.");
    }
    if (userData.yearLevel === undefined) {
      userData.yearLevel = 0;
    }
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, {
      ...userData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    handleFirestoreError(error, `update user with ID ${userId}`);
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, { isDeleted: true, updatedAt: Timestamp.now() });
  } catch (error) {
    handleFirestoreError(error, `soft delete user with ID ${userId}`);
  }
};

export const searchUserByStudentId = async (
  studentId: string,
): Promise<Member | null> => {
  // Encapsulated logic in a single try/catch block for comprehensive error handling.
  try {
    // Replaced duplicated code with a call to the new helper function.
    const currentUser = (await getCurrentUserData()) as unknown as Member;
    if (!currentUser) return null;

    const accessLevel = currentUser.accessLevel;
    const org = await getOrgById(currentUser.orgId!);

    let searchQuery = query(
      usersCollection,
      where("studentId", "==", studentId),
      where("isDeleted", "==", false)
    );

    if (accessLevel === 1 && org) {
      searchQuery = query(searchQuery, where("programId", "==", org.programId ?? ""));
    } else if (accessLevel === 2 && org) {
      searchQuery = query(searchQuery, where("facultyId", "==", org.facultyId ?? ""));
    }

    const querySnapshot = await getDocs(searchQuery);

    if (querySnapshot.empty) {
      return null;
    }

    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    } as unknown as Member;
  } catch (error) {
    handleFirestoreError(error, `search for student ID "${studentId}"`);
    return null;
  }
};

const generateKeywords = (name: string): string[] => {
  if (!name) return [];
  const lowerCaseName = name.toLowerCase();
  const keywords = new Set<string>();
  for (let i = 1; i <= lowerCaseName.length; i++) {
    keywords.add(lowerCaseName.substring(0, i));
  }
  return Array.from(keywords);
};

/**
 * Searches for users by name within a specific faculty.
 * This function fetches all users from the faculty and performs a "contains"
 * search on the client-side by concatenating the user's first and last names.
 *
 * @param name - The name to search for.
 * @param currentUser - The currently authenticated user object (e.g., from Firebase Auth).
 * @returns A promise that resolves to an array of matching Member objects.
 */
export const searchUserByName = async (
  name: string,
  currentUser: any
): Promise<Member[]> => {
  const trimmedName = name.trim().toLowerCase();
  if (!trimmedName) {
    return [];
  }

  // Generate a cache key for the search query
  const cacheKey = getCacheKey({
    page: 1,
    pageSize: 50,
    programFilter: "",
    searchQuery: trimmedName,
    sortBy: "name-asc",
  });

  // Try to get results from cache first
  const cachedData = getMembersCacheEntry(cacheKey);
  if (cachedData) {
    return cachedData.members.map((m) => m.member);
  }

  try {
    const currentUserData = (await getCurrentUserData()) as unknown as Member;
    if (!currentUserData) return [];

    const accessLevel = currentUserData.accessLevel;
    const org = await getOrgById(currentUserData.orgId!);
    const term = await getActiveTerm();

    // This query now performs the search directly in the database
    let searchQuery = query(
      collection(db, "users"),
      where("isDeleted", "==", false)
    );

    if (accessLevel === 1 && org) {
      searchQuery = query(searchQuery, where("programId", "==", org.programId ?? ""));
    } else if (accessLevel === 2 && org) {
      searchQuery = query(searchQuery, where("facultyId", "==", org.facultyId ?? ""));
    }

    searchQuery = query(searchQuery, limit(50));

    const querySnapshot = await getDocs(searchQuery);

   const matchingMembers = querySnapshot.docs
     .map((doc) => ({
       id: doc.id,
       ...doc.data() as Member,
     }))
     .filter((user) => {
       const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
       return fullName.includes(trimmedName);
     }) as unknown as Member[];
    // Sort the results alphabetically by full name
    matchingMembers.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Cache the search results
    const membersToCache = matchingMembers.map((member) => ({
      id: member.studentId,
      member,
    }));
    updateMembersCache(cacheKey, membersToCache, membersToCache.length, term!);

    return matchingMembers;
  } catch (error) {
    handleFirestoreError(error, `search for name "${name}"`);
    return [];
  }
};

export const getUserById = async (userId: string): Promise<Member | null> => {
  try {
    const querySnapshot = await getDocs(
      query(
        usersCollection,
        where(documentId(), "==", userId),
        where("isDeleted", "==", false)
      )
    );
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as unknown as Member;
    } else {
      return null;
    }
  } catch (error) {
    handleFirestoreError(error, `fetching user with ID ${userId}`);
    return null;
  }
};

export const hardDeleteUsers = async (number: number) => {
  try {
    let count = 0;
    const usersQuery = query(
      usersCollection,
      orderBy("createdAt", "desc"),
      limit(number)
    );
    const querySnapshot = await getDocs(usersQuery);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      count++;
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, "hard delete users");
  }
}


export const countUsers = async () => {
  try {
    const querySnapshot = query(
      usersCollection,
      where("role", "==", "user")
    );
    return (await getCountFromServer(querySnapshot)).data().count;
  } catch (error) {
    handleFirestoreError(error, "count users");
    return 0;
  }
}