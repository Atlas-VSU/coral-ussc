"use client";

import { useCallback, useEffect, useRef } from "react";
import { ShieldAlert } from "lucide-react";

const SCRIPT_ID = "recaptcha-v2-script";
const ONLOAD_CALLBACK = "onRecaptchaV2Load";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    grecaptcha?: any;
    [ONLOAD_CALLBACK]?: () => void;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface RecaptchaProps {
  /** Called with the verification token once the checkbox is solved. */
  onVerify: (token: string) => void;
  /** Called when the token expires and the user must re-verify. */
  onExpire?: () => void;
  className?: string;
}

/**
 * reCAPTCHA v2 ("I'm not a robot") checkbox widget.
 * Loads the Google script on demand and renders the widget explicitly.
 *
 * The site key is read from NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY. When it is not
 * configured the widget is not rendered (callers should treat verification as
 * unavailable). For local testing, set the env var to Google's public reCAPTCHA
 * v2 test key in your (gitignored) .env.local.
 */
export function Recaptcha({ onVerify, onExpire, className }: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!siteKey) return;
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha?.render || !containerRef.current) return;
    if (widgetIdRef.current !== null) return;

    const doRender = () => {
      if (!containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerify(token),
        "expired-callback": () => onExpire?.(),
      });
    };

    if (typeof grecaptcha.ready === "function") {
      grecaptcha.ready(doRender);
    } else {
      doRender();
    }
  }, [onVerify, onExpire, siteKey]);

  useEffect(() => {
    if (!siteKey) return;

    // Script already present (e.g. previously loaded) — render immediately.
    if (window.grecaptcha?.render) {
      renderWidget();
      return;
    }

    // Register the global onload callback the script will invoke.
    window[ONLOAD_CALLBACK] = renderWidget;

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = `https://www.google.com/recaptcha/api.js?render=explicit&onload=${ONLOAD_CALLBACK}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      // Reset on unmount so the widget can be re-rendered next time
      // (e.g. when the dialog is reopened).
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {
          /* widget DOM already gone — ignore */
        }
      }
      widgetIdRef.current = null;
    };
  }, [renderWidget, siteKey]);

  // No site key configured — surface a clear, non-blocking notice instead of
  // an empty box.
  if (!siteKey) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        reCAPTCHA isn&apos;t configured for this environment.
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
