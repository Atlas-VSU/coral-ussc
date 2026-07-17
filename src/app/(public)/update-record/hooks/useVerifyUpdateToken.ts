"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "verifying" | "valid" | "error";

interface TokenData {
  studentId: string;
  email: string;
  userId: string;
  student: {
    firstName: string;
    lastName: string;
    programId: string;
    yearLevel: number;
  };
}

export function useVerifyUpdateToken(token: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<TokenData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No update token provided. Please use the link from your email.");
      return;
    }

    setStatus("verifying");

    const verify = async () => {
      try {
        const res = await fetch(
          `/api/public/verify-update-token?token=${encodeURIComponent(token)}`
        );
        const result = await res.json();

        if (!res.ok || !result.success) {
          setStatus("error");
          setErrorMessage(
            result.error ||
              "This update link is invalid or has expired. Please request a new one."
          );
          return;
        }

        setData({
          studentId: result.studentId,
          email: result.email,
          userId: result.userId,
          student: result.student,
        });
        setStatus("valid");
      } catch {
        setStatus("error");
        setErrorMessage("Failed to verify update link. Please try again.");
      }
    };

    void verify();
  }, [token]);

  return { status, data, errorMessage };
}
