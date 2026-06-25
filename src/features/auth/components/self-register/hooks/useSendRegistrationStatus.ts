"use client"

import { useCallback, useState } from "react";
import { toast } from "sonner";

//Hook to send registration status email to user
export const useSendRegistrationStatus = () => {
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const sendRegistrationStatus = useCallback(async (email: string, registrationStatus: string) => {
        setIsSending(true);
        setSendSuccess(false);
        setErrorMessage(null);
        try {
            const response = await fetch("/api/public/send-registration-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    registrationStatus,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to send verification status");
            }
            toast.success("Registration status sent successfully");
            setSendSuccess(true);
            return data;
        } catch (error) {
            console.error(error);
            toast.error("Failed to send registration status");
            setErrorMessage("Failed to send registration status");
        } finally {
            setIsSending(false);
        }
    }, []);
    return { sendRegistrationStatus, isSending, sendSuccess, errorMessage };
};