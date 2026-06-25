"use client";

import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendRegistrationLink } from "@/features/auth/components/self-register/hooks/useSendRegistrationLink";

interface SelfRegisterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SelfRegisterDialog({ isOpen, onOpenChange }: SelfRegisterDialogProps) {
  const [email, setEmail] = useState("");
  const { sendRegistrationLink, isSending, sendSuccess, reset } = useSendRegistrationLink();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      reset();
    }
    onOpenChange(open);
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendRegistrationLink(email);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-white text-black border !border-[#2E7D32]/20 rounded-xl p-6">
        <DialogHeader className="items-center text-center">
          {!sendSuccess ? (
            <div className="w-12 h-12 rounded-full bg-[#8BC34A]/10 flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-[#2E7D32]" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          )}
          <DialogTitle className="text-xl font-bold text-[#1B5E20]">
            {!sendSuccess ? "Verify Your Email Address" : "Verification Link Sent"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm max-w-sm">
            {!sendSuccess
              ? "Incoming freshmen are required to verify their email before registration. We will send a secure self-registration link to your inbox."
              : `We've sent a link to ${email}. Click the link in the email to proceed with your registration.`}
          </DialogDescription>
        </DialogHeader>

        {!sendSuccess ? (
          <form onSubmit={handleSendLink} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your_address@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSending}
                required
                className="w-full !bg-white !text-black !border-[#2E7D32]/30 focus-visible:!ring-green-100"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSending}
                className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending Link...
                  </>
                ) : (
                  "Send Verification Link"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSending}
                className="w-full border-[#2E7D32]/30 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 mt-4">
            <p className="text-xs text-center text-gray-400">
              If you didn't receive the email, please check your spam folder or try again in a few minutes.
            </p>
            <Button
              onClick={() => handleOpenChange(false)}
              className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
