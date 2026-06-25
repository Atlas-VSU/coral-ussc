"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * Hook to send the self-registration verification email link.
 */
export function useSendRegistrationLink() {
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const sendRegistrationLink = async (email: string): Promise<boolean> => {
    if (!email) {
      toast.error("Please enter your email address.");
      return false;
    }

    setIsSending(true);
    setSendSuccess(false);

    try {
      const response = await fetch("/api/public/send-registration-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send link");
      }

      setSendSuccess(true);
      toast.success("Verification link sent!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const reset = () => {
    setSendSuccess(false);
    setIsSending(false);
  };

  return { sendRegistrationLink, isSending, sendSuccess, reset };
}
