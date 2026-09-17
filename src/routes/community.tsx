import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { TdcLogo } from "@/components/tdc/brand";
import { FloatingWhatsApp } from "@/components/tdc/event";
import { SiteFooter } from "@/components/tdc/site";
import { trackMetaConversion } from "@/lib/meta-tracking";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Join TDC Karachi WhatsApp Community | Free Diabetes Support" },
      {
        name: "description",
        content:
          "Join the free TDC Karachi WhatsApp Community for practical diabetes, blood sugar, food, lifestyle and health education updates.",
      },
      {
        property: "og:title",
        content: "Join TDC Karachi WhatsApp Community — Free",
      },
      {
        property: "og:description",
        content:
          "Karachi residents can join the free TDC Karachi WhatsApp Community for practical diabetes and healthy lifestyle information.",
      },
    ],
  }),
  component: CommunityPage,
});

const COMMUNITY_URL = "https://chat.whatsapp.com/IsFRkpIUQcl7TAZB3YSiKT";

function CommunityPage() {
  const joinCommunity = () => {
    void trackMetaConversion("Lead", {
      sessionKey: "tdc_karachi_whatsapp_community",
      source: "whatsapp_community_landing_page",
    });
    window.open(COMMUNITY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background text-navy">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-5 py-4 sm:py-5">
          <TdcLogo />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-tint px-5 py-12 sm:py-16">
          <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-brand/10 blur-2xl" />
          <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand/20 bg-background px-4 py-2 text-sm font-bold text-brand shadow-sm">
              <MessageCircle className="h-4 w-4" />
              FREE WhatsApp Community
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Apko diabetes hai or Karachi me rehty hain?
              <span className="mt-2 block text-brand">To ye WhatsApp Community apk liye hai</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              TDC Karachi کی مفت WhatsApp Community میں شامل ہوں اور ذیابیطس، بلڈ شوگر،
              کھانے پینے، ورزش اور صحت سے متعلق مفید معلومات حاصل کریں۔
            </p>

            <button
              type="button"
              onClick={joinCommunity}
              className="mt-8 inline-flex min-h-14 w-full max-w-xl items-center justify-center gap-3 rounded-full bg-brand-gradient px-8 py-4 text-lg font-extrabold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 sm:text-xl"
            >
              <MessageCircle className="h-6 w-6" />
              Join TDC Karachi WhatsApp Community
            </button>

            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              Free to join · Karachi residents welcome
            </p>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-brand/15 bg-card p-6 shadow-card sm:p-9">
              <div className="text-center">
                <p className="text-sm font-extrabold uppercase tracking-wider text-brand">
                  What you&apos;ll get
                </p>
                <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                  Practical health information, directly on WhatsApp
                </h2>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  "Diabetes & blood sugar education",
                  "Practical food & lifestyle guidance",
                  "Healthy habits & exercise information",
                  "Useful health updates from TDC Karachi",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl bg-tint p-4 text-sm font-semibold leading-6 sm:text-base"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <Users className="h-6 w-6 text-brand" />
                <h3 className="mt-3 font-extrabold">A community for Karachi</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Connect with people interested in learning more about diabetes and healthier daily choices.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <ShieldCheck className="h-6 w-6 text-brand" />
                <h3 className="mt-3 font-extrabold">Educational information</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Community content is for general education and does not replace individual medical advice.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={joinCommunity}
                className="inline-flex min-h-13 w-full max-w-lg items-center justify-center gap-2 rounded-full bg-brand px-7 py-4 font-extrabold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-5 w-5" />
                Join the Free WhatsApp Community →
              </button>
            </div>
          </div>
        </section>
      </main>

      <FloatingWhatsApp />
      <SiteFooter />
    </div>
  );
}
