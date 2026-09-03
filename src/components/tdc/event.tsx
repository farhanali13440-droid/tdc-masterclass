import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { trackMetaConversion } from "@/lib/meta-tracking";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} aria-hidden="true">
      <path
        fill="#25D366"
        d="M12 2a10 10 0 0 0-8.63 15.05L2 22l5.08-1.33A10 10 0 1 0 12 2Z"
      />
      <path
        fill="#fff"
        d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"
      />
    </svg>
  );
}

/**
 * Fired only on an intentional contact action (click), never on render.
 * One event id per action is generated inside `trackMetaConversion` and shared
 * by the browser Pixel (`eventID`) and CAPI (`event_id`). The short guard below
 * stops a double-click / duplicate handler from creating a second event.
 */
let lastContactAt = 0;

export function trackContactClick(): void {
  const now = Date.now();
  if (now - lastContactAt < 3000) return;
  lastContactAt = now;
  void trackMetaConversion("Contact");
}


export const EVENT_DATE = "6 September 2026";
export const EVENT_TIME = "8:00 PM – 10:00 PM PKT";
export const EVENT_TZ = "Pakistan Standard Time (PKT / UTC+5)";
/** Single source of truth for the registration price used in UI + tracking. */
export const EVENT_PRICE = 499;
export const EVENT_CURRENCY = "PKR";
export const EVENT_FEE = `${EVENT_CURRENCY} ${EVENT_PRICE}`;
/** 6 September 2026, 8:00 PM PKT (UTC+5) */
export const EVENT_TARGET_MS = Date.UTC(2026, 8, 6, 15, 0, 0);

export const WHATSAPP_NUMBER = "+92 335 3229580";
const WHATSAPP_DIGITS = "923353229580";
const WHATSAPP_MESSAGE =
  "Hi, I have a question about the Diabetes Control Masterclass on 6 September 2026.";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`;

function useTimeLeft() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now === null) return null;
  const diff = EVENT_TARGET_MS - now;
  if (diff <= 0) return { started: true as const };
  const total = Math.floor(diff / 1000);
  return {
    started: false as const,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({
  variant = "default",
  size = "lg",
  className,
  heading = "The Masterclass Starts In",
}: {
  variant?: "default" | "inverse";
  size?: "sm" | "lg";
  className?: string;
  heading?: string | null;
}) {
  const left = useTimeLeft();
  const inverse = variant === "inverse";

  if (left?.started) {
    return (
      <p
        className={cn(
          "text-base font-extrabold uppercase tracking-[0.14em]",
          inverse ? "text-navy-foreground" : "text-brand",
          className,
        )}
      >
        The Masterclass Has Started
      </p>
    );
  }

  const units = [
    { label: "Days", value: left ? left.days : 0 },
    { label: "Hours", value: left ? left.hours : 0 },
    { label: "Minutes", value: left ? left.minutes : 0 },
    { label: "Seconds", value: left ? left.seconds : 0 },
  ];

  return (
    <div className={cn("min-w-0", className)}>
      {heading ? (
        <p
          className={cn(
            "mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em]",
            inverse ? "text-navy-foreground/80" : "text-brand",
          )}
        >
          {heading}
        </p>
      ) : null}
      <div
        className={cn("grid grid-cols-4 gap-2", size === "sm" ? "max-w-xs" : "max-w-md")}
        role="timer"
        aria-live="off"
      >
        {units.map((unit) => (
          <div
            key={unit.label}
            className={cn(
              "rounded-2xl px-2 py-2.5 text-center",
              inverse
                ? "bg-navy-foreground/12 ring-1 ring-navy-foreground/20"
                : "bg-tint ring-1 ring-brand/15",
            )}
          >
            <span
              className={cn(
                "block font-extrabold tabular-nums leading-none",
                size === "sm" ? "text-xl" : "text-2xl sm:text-3xl",
                inverse ? "text-navy-foreground" : "text-navy",
              )}
            >
              {left ? pad(unit.value) : "--"}
            </span>
            <span
              className={cn(
                "mt-1 block text-[0.6rem] font-bold uppercase tracking-[0.12em]",
                inverse ? "text-navy-foreground/70" : "text-muted-foreground",
              )}
            >
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WhatsAppButton({
  children = "Have Questions? Chat With Us on WhatsApp",
  variant = "outline",
  className,
  size = "lg",
}: {
  children?: React.ReactNode;
  variant?: "outline" | "light" | "solid";
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackContactClick}
      className={cn(
        "inline-flex max-w-full items-center justify-center gap-2 rounded-full text-center font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        size === "lg" ? "min-h-13 px-6 py-4 text-sm sm:text-base" : "min-h-11 px-5 py-3 text-sm",
        variant === "outline" && "border-2 border-brand bg-transparent text-brand hover:bg-tint",
        variant === "light" &&
          "bg-background text-navy shadow-float hover:-translate-y-0.5 hover:bg-tint",
        variant === "solid" &&
          "bg-brand-gradient text-primary-foreground shadow-float hover:brightness-110",
        className,
      )}
    >
      <WhatsAppIcon className="h-5 w-5" />
      <span className="text-balance">{children}</span>
    </a>
  );
}

export function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackContactClick}
      aria-label="Chat with The Diabetes Centre Pakistan on WhatsApp"
      className="fixed right-4 bottom-24 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] shadow-float transition-transform hover:scale-105 sm:bottom-6 sm:h-14 sm:w-14"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
