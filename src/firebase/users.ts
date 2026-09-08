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
  QueryDocumentSnapshot,
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
      where("role", "==", "user"),
      where("status", "==", "approved")
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

/**
 * Canonical form of a Student ID, used for comparison only — never written.
 *
 * Mirrors `normaliseStudentId` in the super-admin roster sync, which is the
 * other half of this contract: cosmetic variance (a stray space, a different
 * dash) is the documented cause of the duplicate pairs `dedupeStudentRecords`
 * has to clean up, so both sides must compare on the same canonical shape.
 *
 * NOTE: this normalizes the *lookup value* only. A record whose STORED id is
 * in a non-canonical shape still misses, because Firestore cannot match on a
 * computed value. Closing that gap needs a stored `studentIdNormalized` field
 * plus a backfill — deliberately out of scope here.
 */
export const normaliseStudentId = (raw: string): string => {
  const digits = raw.trim().replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}-${digits[2]}-${digits.slice(3)}`;
  }
  return raw.trim();
};

/**
 * The three states a Student ID can be in, from the point of view of anyone
 * trying to onboard that student.
 */
export type StudentIdentityResolution =
  /** No record holds this Student ID — safe to create a new one. */
  | { status: "available" }
  /** A live record already holds it — a genuine duplicate; block. */
  | { status: "active"; docId: string; member: Member }
  /** Only a soft-deleted record holds it — offer to restore rather than
   *  creating a second document for the same person. */
  | {
      status: "archived";
      docId: string;
      member: Member;
      /** How many restorable archived records share this Student ID. Above 1
       *  the choice of `docId` is a guess, so the caller must say so. */
      archivedCount: number;
    };

/** Every record holding this Student ID, matched on the raw value and, when it
 *  differs, on the canonical one. Two indexed lookups rather than a scan. */
const fetchRecordsForStudentId = async (studentId: string) => {
  const raw = studentId.trim();
  const canonical = normaliseStudentId(studentId);

  const snapshot = await getDocs(
    query(usersCollection, where("studentId", "==", raw))
  );
  if (!snapshot.empty || canonical === raw) return snapshot.docs;

  const fallback = await getDocs(
    query(usersCollection, where("studentId", "==", canonical))
  );
  return fallback.docs;
};

/** Millis of the most recent timestamp on a user doc, for ordering archives. */
const lastTouchedAt = (data: DocumentData): number => {
  const candidate = data?.metadata?.updatedAt ?? data?.updatedAt ?? data?.createdAt;
  return typeof candidate?.toMillis === "function" ? candidate.toMillis() : 0;
};

/**
 * The archived record that should be offered for restore, newest first.
 *
 * Records carrying `mergedIntoUserId` are excluded outright: the dedupe script
 * stamps that when it deliberately merges a duplicate away, so bringing one
 * back recreates exactly the double charge the merge resolved.
 *
 * Ordering is explicit because an unfiltered equality query returns documents
 * in `__name__` order — picking `docs[0]` would restore whichever record
 * happens to sort first by id, not the one most recently retired.
 */
const pickRestorableArchived = (
  docs: QueryDocumentSnapshot<DocumentData>[],
  excludeDocId?: string
) =>
  docs
    .filter(
      (d) =>
        d.id !== excludeDocId &&
        d.data().isDeleted === true &&
        !d.data().mergedIntoUserId
    )
    .sort((a, b) => lastTouchedAt(b.data()) - lastTouchedAt(a.data()));

/**
 * Resolves what already exists behind a Student ID before anything is created.
 *
 * WHY THIS EXISTS: `checkStudentIdExist` deliberately ignores soft-deleted
 * records, so re-adding a student the roster sync had retired passed the
 * duplicate check and silently created a SECOND user document. Fees, fines and
 * clearance key on the document id, so the student's entire history stayed
 * stranded on the dead record while onboarding backfilled a fresh set of
 * charges onto the new one — a double charge with the payment history
 * invisible. The next roster sync then refused to run at all, because two
 * records shared one Student ID.
 *
 * Callers must branch on all three states: "archived" is a restore, never a
 * create. See `restoreStudentRecord`.
 */
export const resolveStudentIdentity = async (
  studentId: string
): Promise<StudentIdentityResolution> => {
  // Deliberately unfiltered by isDeleted — the soft-deleted records are the
  // whole point of this lookup.
  const docs = await fetchRecordsForStudentId(studentId);

  if (docs.length === 0) return { status: "available" };

  const live = docs.find((d) => d.data().isDeleted !== true);
  if (live) {
    return { status: "active", docId: live.id, member: live.data() as Member };
  }

  const restorable = pickRestorableArchived(docs);

  // Records exist, but every one of them was merged away deliberately.
  // Restoring any of those recreates a duplicate pair, so creating a fresh
  // record is the correct outcome — and the roster sync tolerates it, since it
  // only treats two *live* records as a collision.
  if (restorable.length === 0) return { status: "available" };

  const archived = restorable[0];
  return {
    status: "archived",
    docId: archived.id,
    member: archived.data() as Member,
    archivedCount: restorable.length,
  };
};

/**
 * Finds a soft-deleted record holding this Student ID, ignoring one document.
 *
 * Used where the student already has a live record of their own — a pending
 * self-registration, say — and we need to know whether an older retired record
 * exists for the same person. Approving without noticing leaves a permanent
 * duplicate pair: history on the retired document, new charges on the live one.
 */
export const findArchivedRecordForStudentId = async (
  studentId: string,
  excludeDocId?: string
): Promise<{ docId: string; member: Member } | null> => {
  const docs = await fetchRecordsForStudentId(studentId);
  const archived = pickRestorableArchived(docs, excludeDocId)[0];

  return archived ? { docId: archived.id, member: archived.data() as Member } : null;
};

/**
 * True when a LIVE record already holds this Student ID.
 *
 * Retained for callers that only need the boolean, and kept deliberately blind
 * to soft-deleted records so existing behaviour is unchanged. Anything that
 * creates a student should use `resolveStudentIdentity` instead, so an archived
 * record is restored rather than duplicated.
 */
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

export const checkEmailExist = async (email: string) => {
  try {
    const querySnapshot = await getDocs(
      query(
        usersCollection,
        where("email", "==", email),
        where("isDeleted", "==", false)
      )
    );
    return !querySnapshot.empty;
  } catch (error) {
    handleFirestoreError(error, "check email existence");
    return false;
  }
};

export const addUser = async (userData: MemberFormData) => {
  try {
    if (await checkStudentIdExist(userData.studentId)) {
      throw new Error("Student ID already exists.");
    }
    if (await checkEmailExist(userData.email)) {
      throw new Error("Email already exists.");
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
      status: "approved",
      registrationAt: Timestamp.now(),
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

    if (!userData.facultyId || userData.facultyId == undefined) {
      if(userData.programId == "") {
        throw new Error("No faculty ID or program ID provided for update.");
      }
      const program = await getProgramById(userData.programId);
      if(!program) {
        throw new Error("No program found for the provided program ID.");
      }
      userData.facultyId = program.facultyId;
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

    //soft delete fees 
    const feeQuery = query(collection(db, "fees"), where("userId", "==", userId), where("status","==","unpaid" ));
    const feeSnapshot = await getDocs(feeQuery);
    feeSnapshot.docs.forEach((doc) => {
      updateDoc(doc.ref, { isArchived: true, updatedAt: Timestamp.now() });
    });
    //soft deleet fines
    const fineQuery = query(collection(db, "fines"), where("userId", "==", userId), where("status","==", "unpaid"));
    const fineSnapshot = await getDocs(fineQuery);
    fineSnapshot.docs.forEach((doc) => {
      updateDoc(doc.ref, { 'metadata.isArchived': true, 'metadata.updatedAt': Timestamp.now() });
    });
    //soft deelte clearance
    const clearanceQuery = query(collection(db, "clearanceStatus"), where("userId", "==", userId));
    const clearanceSnapshot = await getDocs(clearanceQuery);
    clearanceSnapshot.docs.forEach((doc) => {
      updateDoc(doc.ref, { isArchived: true, updatedAt: Timestamp.now() });
    });
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
export const deleteAllNonAdminMembers = async () => {
  try {
    const querySnapshot = await getDocs(
      query(usersCollection, where("role", "==", "user"))
    );

    const docs = querySnapshot.docs;
    const BATCH_SIZE = 500;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const chunk = docs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Deleted ${Math.min(i + BATCH_SIZE, docs.length)}/${docs.length}`);
    }
  } catch (error) {
    handleFirestoreError(error, "delete all non-admin members");
  }
};