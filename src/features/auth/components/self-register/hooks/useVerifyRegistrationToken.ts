"use client";

import { useEffect, useState } from "react";

/**
 * Hook to verify self-registration token from the URL.
 */
export function useVerifyRegistrationToken(token: string | null) {
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Registration link is missing. Please request a verification link on the homepage.");
      return;
    }

    let active = true;

    const verifyToken = async () => {
      setStatus("verifying");
      try {
        const response = await fetch("/api/public/verify-registration-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (active) {
          if (response.ok && data.valid) {
            setEmail(data.email);
            setStatus("success");
          } else {
            setErrorMessage(data.error || "This registration link is invalid or has expired.");
            setStatus("error");
          }
        }
      } catch (err) {
        if (active) {
          setErrorMessage("An error occurred during verification. Please try again.");
          setStatus("error");
        }
      }
    };

    void verifyToken();

    return () => {
      active = false;
    };
  }, [token]);

  return { status, email, errorMessage };
}
