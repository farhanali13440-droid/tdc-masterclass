import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export const EVENT_DATE = "6 September 2026";
export const EVENT_TIME = "8:00 PM – 10:00 PM PKT";
export const EVENT_TZ = "Pakistan Standard Time (PKT / UTC+5)";
export const EVENT_FEE = "PKR 499";
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
      <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
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
      aria-label="Chat with The Diabetes Centre Pakistan on WhatsApp"
      className="fixed right-4 bottom-24 z-40 grid h-12 w-12 place-items-center rounded-full bg-brand-gradient text-primary-foreground shadow-float transition-transform hover:scale-105 sm:bottom-6 sm:h-14 sm:w-14"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}
