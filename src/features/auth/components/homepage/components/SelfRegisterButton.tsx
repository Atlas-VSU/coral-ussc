// SelfRegisterButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  GraduationCap,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Recaptcha } from "@/components/ui/recaptcha";

export function SelfRegisterButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // When reCAPTCHA isn't configured, don't block navigation on a token that can
  // never arrive — the gate just becomes a confirmation step.
  const recaptchaConfigured = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY
  );
  const canContinue = recaptchaConfigured ? Boolean(token) : true;

  const handleContinue = () => {
    if (!canContinue || isNavigating) return;
    setIsNavigating(true);
    router.push("/self-register");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setToken(null);
      setIsNavigating(false);
    }
  };

  return (
    <>
      <div className="flex justify-center lg:justify-start mt-3 mb-2 animate-fade-in-up delay-300">
        <button
          onClick={() => setOpen(true)}
          className="
              relative inline-flex items-center gap-3
              px-8 py-4
              rounded-xl
              bg-white text-[#1F7700] font-bold text-base tracking-wide
              border-2 border-[#2E7D32]
              shadow-md shadow-green-800/10
              hover:bg-[#2E7D32] hover:text-white
              hover:shadow-lg hover:shadow-green-800/30
              hover:scale-[1.03]
              active:scale-[0.98]
              transition-all duration-200 ease-out
              group
          "
        >
          <GraduationCap className="w-5 h-5" />
          <span className="text-base">Freshman Self-Register</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>

      {/* reCAPTCHA v2 verification gate — must be solved before navigating */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md bg-white text-black border !border-[#2E7D32]/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1B5E20]">
              <ShieldCheck className="h-5 w-5" />
              Verify you&apos;re human
            </DialogTitle>
            <DialogDescription className="text-[#2E7D32]/70">
              Please complete the verification below before continuing to the
              freshman registration form.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-[78px] justify-center py-2">
            <Recaptcha
              onVerify={setToken}
              onExpire={() => setToken(null)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isNavigating}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              type="button"
              onClick={handleContinue}
              disabled={!canContinue || isNavigating}
            >
              {isNavigating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
