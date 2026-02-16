import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase.config";

export type UserData = {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  facultyId?: string;
};

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      try {
        if (authUser) {
          // Get additional user data from Firestore
          const userDocRef = doc(db, "users", authUser.uid);
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            const firestoreData = userSnapshot.data();
            // Combine auth and Firestore data
            setUser({
              uid: authUser.uid,
              name: firestoreData.name,
              email: authUser.email || firestoreData.email || "",
              avatar: authUser.photoURL || "",
              firstName: firestoreData.firstName,
              lastName: firestoreData.lastName,
              role: firestoreData.role || "user",
              facultyId: firestoreData.facultyId,
            });
          } else {
            // Use auth data if Firestore document doesn't exist
            setUser({
              uid: authUser.uid,
              name: authUser.displayName || "User",
              email: authUser.email || "",
              avatar: authUser.photoURL || "",
              role: "user",
            });
          }
        } else {
          setUser(null);
        }
        setError(null);
      } catch (err) {
        console.error("Error in authentication hook:", err);
        setError(
          err instanceof Error ? err : new Error("Authentication error")
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  return { user, loading, error, isAuthenticated: !!user };
}
