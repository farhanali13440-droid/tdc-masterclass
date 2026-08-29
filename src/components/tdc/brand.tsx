import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import logo from "@/assets/tdc-logo.png";
import { cn } from "@/lib/utils";
import { trackMetaConversion } from "@/lib/meta-tracking";

/** Intentional click on a "register / join" CTA = the visitor starts checkout. */
export function trackInitiateCheckout(): void {
  void trackMetaConversion("InitiateCheckout", {
    sessionKey: "initiatecheckout",
    value: 499,
    currency: "PKR",
  });
}

export const MASTERCLASS_PRICE = "PKR 499";
export const PRIMARY_CTA = "Join the Diabetes Control Masterclass — PKR 499";

export function TdcLogo({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "inverse";
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <img
        src={logo}
        alt="The Diabetes Centre Pakistan logo"
        width={64}
        height={64}
        loading="lazy"
        className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
      />
      <span className="min-w-0 leading-tight">
        <span
          className={cn(
            "block text-[0.95rem] font-extrabold tracking-tight sm:text-base",
            variant === "inverse" ? "text-navy-foreground" : "text-navy",
          )}
        >
          The Diabetes Centre
        </span>
        <span
          className={cn(
            "block text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
            variant === "inverse" ? "text-navy-foreground/70" : "text-brand",
          )}
        >
          Pakistan
        </span>
      </span>
    </span>
  );
}

type CtaProps = {
  children?: ReactNode;
  size?: "md" | "lg";
  variant?: "primary" | "light" | "outline";
  className?: string;
  /** used for conversion tracking */
  event: string;
};

export function CtaButton({
  children = PRIMARY_CTA,
  size = "lg",
  variant = "primary",
  className,
  event,
}: CtaProps) {
  return (
    <Link
      to="/checkout"
      onClick={trackInitiateCheckout}
      data-cta={event}
      id={`cta-${event}`}
      className={cn(
        "group inline-flex max-w-full items-center justify-center gap-2 rounded-full text-center font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        size === "lg"
          ? "min-h-13 px-6 py-4 text-sm sm:text-base"
          : "min-h-11 px-5 py-3 text-sm",
        variant === "primary" &&
          "bg-brand-gradient text-primary-foreground shadow-float hover:-translate-y-0.5 hover:brightness-110",
        variant === "light" &&
          "bg-background text-navy shadow-float hover:-translate-y-0.5 hover:bg-tint",
        variant === "outline" &&
          "border-2 border-brand bg-transparent text-brand hover:bg-tint",
        className,
      )}
    >
      <span className="text-balance">{children}</span>
      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function Eyebrow({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "inverse";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em]",
        variant === "inverse"
          ? "bg-navy-foreground/10 text-navy-foreground ring-1 ring-navy-foreground/20"
          : "bg-tint text-brand ring-1 ring-brand/15",
      )}
    >
      {children}
    </span>
  );
}

export function Section({
  children,
  className,
  id,
  tone = "plain",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "plain" | "tint" | "soft" | "navy";
}) {
  return (
    <section
      id={id}
      className={cn(
        "px-5 py-16 sm:px-8 sm:py-20 lg:py-28",
        tone === "tint" && "bg-tint",
        tone === "soft" && "bg-soft-gradient",
        tone === "navy" && "bg-brand-gradient text-navy-foreground",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  variant = "default",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  variant?: "default" | "inverse";
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 sm:mb-14",
        align === "center" ? "items-center text-center" : "items-start text-left",
      )}
    >
      {eyebrow ? <Eyebrow variant={variant}>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "max-w-3xl text-balance text-3xl font-extrabold leading-[1.15] sm:text-4xl lg:text-[2.75rem]",
          variant === "inverse" ? "text-navy-foreground" : "text-navy",
        )}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={cn(
            "max-w-2xl text-pretty text-base leading-relaxed sm:text-lg",
            variant === "inverse" ? "text-navy-foreground/85" : "text-muted-foreground",
          )}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}

export function UrduLine({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "inverse";
}) {
  return (
    <p
      lang="ur"
      className={cn(
        "urdu text-lg sm:text-xl",
        variant === "inverse" ? "text-navy-foreground" : "text-brand",
        className,
      )}
    >
      {children}
    </p>
  );
}
