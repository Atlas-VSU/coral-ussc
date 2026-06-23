import { ShieldCheck } from "lucide-react";
import { Recaptcha } from "@/components/ui/recaptcha";

interface RecaptchaSectionProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

/** reCAPTCHA v2 verification section displayed inside the registration form. */
export function RecaptchaSection({ onVerify, onExpire }: RecaptchaSectionProps) {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
        <span className="text-sm font-semibold text-[#1B5E20]">
          Verify you&apos;re human
        </span>
      </div>
      <div className="flex justify-center rounded-lg border !border-[#2E7D32]/20 bg-[#8BC34A]/5 px-4 py-4">
        <Recaptcha onVerify={onVerify} onExpire={onExpire} />
      </div>
    </div>
  );
}
