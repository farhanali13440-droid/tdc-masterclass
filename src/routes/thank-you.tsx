import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock, Clock3, GraduationCap, Upload } from "lucide-react";
import { useEffect } from "react";

import { CtaButton, Eyebrow, TdcLogo } from "@/components/tdc/brand";
import {
  Countdown,
  EVENT_CURRENCY,
  EVENT_DATE,
  EVENT_PRICE,
  EVENT_TIME,
  FloatingWhatsApp,
  WHATSAPP_NUMBER,
  WhatsAppButton,
} from "@/components/tdc/event";
import { SiteFooter } from "@/components/tdc/site";
import { readPendingRegistration, trackMetaConversion } from "@/lib/meta-tracking";

export const Route = createFileRoute("/thank-you")({
  validateSearch: (search: Record<string, unknown>) => ({
    rid: typeof search['rid'] === "string" ? (search['rid'] as string) : undefined,
  }),

  head: () => ({
    meta: [
      { title: "You're Registered | Diabetes Control Masterclass — TDC Pakistan" },
      {
        name: "description",
        content:
          "Your registration for the Diabetes Control Masterclass by The Diabetes Centre Pakistan has been submitted. Here's what happens next.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "You're Registered — Diabetes Control Masterclass" },
      {
        property: "og:description",
        content:
          "Thank you for registering for the Diabetes Control Masterclass by The Diabetes Centre Pakistan.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/thank-you" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/thank-you" }],
  }),
  component: ThankYouPage,
});

const steps = [
  {
    number: "01",
    title: "Payment Submitted",
    body: "Your payment screenshot has been submitted with your registration details.",
    icon: Upload,
    done: true,
  },
  {
    number: "02",
    title: "Payment Verification",
    body: "The TDC team will verify your registration and payment.",
    icon: Clock,
    done: false,
  },
  {
    number: "03",
    title: "Masterclass Access",
    body: "You will receive the relevant masterclass details and joining instructions.",
    icon: GraduationCap,
    done: false,
  },
];

function ThankYouPage() {
  const { rid } = Route.useSearch();

  useEffect(() => {
    document.dispatchEvent(new CustomEvent("tdc:thank-you-view"));
  }, []);

  useEffect(() => {
    const pending = readPendingRegistration();
    const registrationId = rid ?? pending?.id;
    if (!registrationId) return;

    // Purchase only counts when THIS browser just completed a successful
    // submission (flag written by the checkout page after the save succeeds).
    // Someone opening /thank-you directly never triggers it.
    const justSubmitted = pending?.submitted === true && pending.id === registrationId;

    void (async () => {
      // Registration completed — idempotent per registration id, so a refresh
      // never produces a second conversion.
      await trackMetaConversion("CompleteRegistration", {
        dedupeKey: `completeregistration:${registrationId}`,
        eventIdSuffix: registrationId.slice(0, 8),
        registrationId,
      });

      if (!justSubmitted) return;
      await trackMetaConversion("Purchase", {
        dedupeKey: `purchase:${registrationId}`,
        registrationId,
        value: EVENT_PRICE,
        currency: EVENT_CURRENCY,
      });
    })();
  }, [rid]);


  return (
    <div id="thank-you-page" className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="bg-brand-gradient px-5 py-16 text-navy-foreground sm:px-8 sm:py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <div className="rounded-3xl bg-background/95 px-6 py-4">
              <TdcLogo />
            </div>
            <span className="grid h-16 w-16 place-items-center rounded-full bg-navy-foreground/15 ring-1 ring-navy-foreground/25">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </span>
            <Eyebrow variant="inverse">Registration Received</Eyebrow>
            <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl">
              You're Registered!
            </h1>
            <p className="text-pretty text-base leading-relaxed text-navy-foreground/90 sm:text-lg">
              Thank you for registering for the Diabetes Control Masterclass by The Diabetes
              Centre Pakistan.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl bg-navy-foreground/12 px-6 py-4 text-sm font-bold ring-1 ring-navy-foreground/20">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" /> {EVENT_DATE}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" aria-hidden="true" /> {EVENT_TIME}
              </span>
            </div>
            <Countdown variant="inverse" size="sm" className="mx-auto" />
            <p lang="ur" className="urdu text-lg text-navy-foreground/90">
              آپ نے پہلا قدم اٹھا لیا ہے۔
            </p>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">Your Next Step</h2>
            <p className="mt-3 text-muted-foreground">
              Our team will verify your payment and contact you through WhatsApp/email with the
              masterclass details.
            </p>

            <ol className="mt-10 space-y-4">
              {steps.map((step) => (
                <li
                  key={step.number}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6"
                >
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                      step.done ? "bg-brand-gradient text-primary-foreground" : "bg-tint text-brand"
                    }`}
                  >
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                      {step.number}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-navy">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 rounded-3xl border border-border bg-tint p-6">
              <TdcLogo />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Please watch for further masterclass instructions from The Diabetes Centre
                Pakistan on WhatsApp and email. Need help with your registration? Message us on{" "}
                <strong className="text-navy">{WHATSAPP_NUMBER}</strong>.
              </p>
              <WhatsAppButton size="md" className="mt-4">
                Chat With Us on WhatsApp
              </WhatsAppButton>
            </div>

            <div className="mt-10 flex justify-center">
              <CtaButton event="thank-you-secondary" variant="outline" size="md">
                Register another participant
              </CtaButton>
            </div>
          </div>
        </section>
      </main>
      <FloatingWhatsApp />
      <SiteFooter />
    </div>
  );
}
