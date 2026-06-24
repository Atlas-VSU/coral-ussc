import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Recaptcha } from "@/components/ui/recaptcha";

interface RecaptchaSectionProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

/** reCAPTCHA v2 verification section displayed inside the registration form. */
export function RecaptchaSection({ onVerify, onExpire }: RecaptchaSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;

    const handleResize = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const computedStyle = window.getComputedStyle(parent);
      const paddingLeft = parseFloat(computedStyle.paddingLeft);
      const paddingRight = parseFloat(computedStyle.paddingRight);
      const availableWidth = parent.clientWidth - paddingLeft - paddingRight;

      if (availableWidth < 302) {
        setScale(availableWidth / 302);
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [siteKey]);

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
        <span className="text-sm font-semibold text-[#1B5E20]">
          Verify you&apos;re human
        </span>
      </div>
      <div className="flex justify-center rounded-lg border !border-[#2E7D32]/20 bg-[#8BC34A]/5 px-4 py-4 overflow-hidden">
        {siteKey ? (
          <div
            ref={containerRef}
            className="flex justify-center items-center"
            style={{
              width: "100%",
              height: `${78 * scale}px`,
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                width: "302px",
                height: "78px",
              }}
            >
              <Recaptcha onVerify={onVerify} onExpire={onExpire} />
            </div>
          </div>
        ) : (
          <Recaptcha onVerify={onVerify} onExpire={onExpire} />
        )}
      </div>
    </div>
  );
}
