import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  FileUp,
  Loader2,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";

import { TdcLogo } from "@/components/tdc/brand";
import {
  EVENT_DATE,
  EVENT_FEE,
  EVENT_TIME,
  FloatingWhatsApp,
  WhatsAppButton,
} from "@/components/tdc/event";
import { SiteFooter } from "@/components/tdc/site";
import { supabase } from "@/integrations/supabase/client";
import {
  splitName,
  storePendingRegistration,
  trackMetaConversion,
} from "@/lib/meta-tracking";


export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      {
        title: "Register — Diabetes Control Masterclass | TDC Pakistan",
      },
      {
        name: "description",
        content:
          "Register for the Diabetes Control Masterclass on 6 September 2026, 8:00 PM–10:00 PM PKT. Transfer PKR 499 by bank and upload your payment screenshot.",
      },
      { property: "og:title", content: "Register — Diabetes Control Masterclass" },
      {
        property: "og:description",
        content:
          "Complete your registration for the Diabetes Control Masterclass by The Diabetes Centre Pakistan — PKR 499.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/checkout" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: CheckoutPage,
});

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

const BANK_DETAILS = [
  { label: "Bank", value: "Dubai Islamic Bank", copy: false },
  { label: "Account Title", value: "The diabetes center", copy: true },
  { label: "Account Number", value: "155380005", copy: true },
  { label: "IBAN", value: "PK76DUIB0000000155380005", copy: true },
];

const howToRegister = [
  "Step 1: Transfer PKR 499 to the bank account below.",
  "Step 2: Save your successful payment receipt/screenshot.",
  "Step 3: Complete the registration form.",
  "Step 4: Upload your payment screenshot.",
  "Step 5: Submit your registration.",
];

const schema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Please enter a valid WhatsApp number")
    .max(20, "Please enter a valid WhatsApp number")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid WhatsApp number"),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  city: z.string().trim().min(2, "Please enter your city").max(80),
  age: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d{1,3}$/.test(v) && Number(v) > 0 && Number(v) < 120), {
      message: "Please enter a valid age",
    }),
  hasDiabetes: z.string().optional(),
  diabetesType: z.string().optional(),
});

type Errors = Partial<Record<string, string>>;

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${label}`}
      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-brand/30 bg-background px-3 text-xs font-bold text-brand transition-colors hover:bg-tint"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" /> Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy
        </>
      )}
    </button>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    document.dispatchEvent(new CustomEvent("tdc:checkout-view"));
  }, []);

  const markStart = () => {
    if (!started.current) {
      started.current = true;
      document.dispatchEvent(new CustomEvent("tdc:registration-start"));
    }
  };

  const onFileChange = (selected: File | null) => {
    markStart();
    setFile(selected);
    if (!selected) return;
    if (!ACCEPTED.includes(selected.type)) {
      setErrors((e) => ({ ...e, paymentProof: "Upload a JPG, PNG or PDF file" }));
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setErrors((e) => ({ ...e, paymentProof: "File must be smaller than 5 MB" }));
      return;
    }
    setErrors((e) => ({ ...e, paymentProof: undefined }));
    document.dispatchEvent(new CustomEvent("tdc:payment-proof-uploaded"));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse({
      fullName: data['fullName'] ?? "",
      whatsapp: data['whatsapp'] ?? "",
      email: data['email'] ?? "",
      city: data['city'] ?? "",
      age: data['age'] ?? "",
      hasDiabetes: data['hasDiabetes'] ?? "",
      diabetesType: data['diabetesType'] ?? "",
    });

    const nextErrors: Errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
    }
    if (!file) {
      nextErrors['paymentProof'] = "Payment screenshot is required";
    } else if (!ACCEPTED.includes(file.type)) {
      nextErrors['paymentProof'] = "Upload a JPG, PNG or PDF file";
    } else if (file.size > MAX_FILE_BYTES) {
      nextErrors['paymentProof'] = "File must be smaller than 5 MB";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !parsed.success || !file) {
      const firstInvalid = document.querySelector<HTMLElement>("[data-invalid='true']");
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    const registrationId = crypto.randomUUID();
    const { firstName, lastName } = splitName(parsed.data.fullName);
    const customer = {
      email: parsed.data.email,
      phone: parsed.data.whatsapp,
      firstName,
      lastName,
      city: parsed.data.city,
      externalId: registrationId,
    };

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${registrationId}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      // Payment proof successfully stored → AddPaymentInfo.
      void trackMetaConversion("AddPaymentInfo", {
        dedupeKey: `addpaymentinfo:${registrationId}`,
        eventIdSuffix: registrationId.slice(0, 8),
        registrationId,
        customer,
      });

      const { error: insertError } = await supabase
        .from("masterclass_registrations")
        .insert({
          id: registrationId,
          full_name: parsed.data.fullName,
          whatsapp: parsed.data.whatsapp,
          email: parsed.data.email,
          city: parsed.data.city,
          age: parsed.data.age ? Number(parsed.data.age) : null,
          has_diabetes: parsed.data.hasDiabetes || null,
          diabetes_type: parsed.data.diabetesType || null,
          payment_proof_path: path,
          amount_pkr: 499,
        });
      if (insertError) throw insertError;

      // Registration/application submitted successfully.
      void trackMetaConversion("SubmitApplication", {
        dedupeKey: `submitapplication:${registrationId}`,
        eventIdSuffix: registrationId.slice(0, 8),
        registrationId,
        customer,
      });
      // Contact details captured successfully → Lead.
      void trackMetaConversion("Lead", {
        dedupeKey: `lead:${registrationId}`,
        eventIdSuffix: registrationId.slice(0, 8),
        registrationId,
        customer,
      });

      storePendingRegistration({
        id: registrationId,
        email: parsed.data.email,
        phone: parsed.data.whatsapp,
        firstName,
        lastName,
        city: parsed.data.city,
      });

      document.dispatchEvent(new CustomEvent("tdc:registration-submitted"));
      await navigate({ to: "/thank-you", search: { rid: registrationId } });

    } catch (error) {
      console.error(error);
      setFormError(
        "We couldn't submit your registration. Please check your connection and try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-tint">
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/" aria-label="The Diabetes Centre Pakistan home" className="min-w-0">
            <TdcLogo />
          </Link>
          <span className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:flex">
            <Lock className="h-4 w-4" aria-hidden="true" /> Secure registration
          </span>
        </div>
      </header>

      <main id="checkout-page" className="flex-1 px-5 py-10 pb-24 sm:px-8 sm:py-14">
        <div className="mx-auto w-full max-w-5xl">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="min-w-0">
                <h1 className="text-balance text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
                  Diabetes Control Masterclass
                </h1>
                <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-navy">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-brand" aria-hidden="true" /> {EVENT_DATE}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-brand" aria-hidden="true" /> {EVENT_TIME}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-brand" aria-hidden="true" /> Registration Fee:{" "}
                    {EVENT_FEE}
                  </span>
                </p>
              </div>
              <TdcLogo className="shrink-0" />
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-muted-foreground">
            Complete the short form below, transfer PKR 499 to the bank account shown and upload
            your payment screenshot. Our team will verify and share the masterclass details with
            you.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <form
              noValidate
              onSubmit={onSubmit}
              onChange={markStart}
              className="order-2 space-y-8 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8 lg:order-1"
            >
              <fieldset className="space-y-5" disabled={submitting}>
                <legend className="text-lg font-bold text-navy">Your details</legend>

                <Field
                  label="Full Name"
                  name="fullName"
                  required
                  error={errors['fullName']}
                  autoComplete="name"
                />
                <Field
                  label="WhatsApp Number"
                  name="whatsapp"
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="03xx xxxxxxx"
                  error={errors['whatsapp']}
                  autoComplete="tel"
                />
                <Field
                  label="Email Address"
                  name="email"
                  required
                  type="email"
                  inputMode="email"
                  error={errors['email']}
                  autoComplete="email"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="City"
                    name="city"
                    required
                    error={errors['city']}
                    autoComplete="address-level2"
                  />
                  <Field
                    label="Age"
                    name="age"
                    type="number"
                    inputMode="numeric"
                    error={errors['age']}
                  />
                </div>

                <SelectField
                  label="Do you currently have diabetes?"
                  name="hasDiabetes"
                  options={["Yes", "No", "Not sure"]}
                />
                <SelectField
                  label="Diabetes Type"
                  name="diabetesType"
                  options={["Type 1", "Type 2", "Prediabetes", "Not sure", "Not applicable"]}
                />
              </fieldset>

              <fieldset className="space-y-4" disabled={submitting}>
                <legend className="text-lg font-bold text-navy">
                  Pay Registration Fee — {EVENT_FEE}
                </legend>

                <div className="rounded-2xl bg-tint p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">
                    How to Register
                  </p>
                  <ol className="mt-4 space-y-2.5">
                    {howToRegister.map((step) => (
                      <li key={step} className="flex items-start gap-3 text-sm text-navy">
                        <BadgeCheck
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                          aria-hidden="true"
                        />
                        <span className="min-w-0">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-2xl border border-brand/20 bg-background p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-navy">
                    <Building2 className="h-4 w-4 text-brand" aria-hidden="true" /> Bank Transfer
                    Details
                  </p>
                  <dl className="mt-4 space-y-3">
                    {BANK_DETAILS.map((detail) => (
                      <div
                        key={detail.label}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-tint px-4 py-3"
                      >
                        <div className="min-w-0">
                          <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                            {detail.label}
                          </dt>
                          <dd className="select-all break-all text-sm font-extrabold text-navy">
                            {detail.value}
                          </dd>
                        </div>
                        {detail.copy ? (
                          <CopyButton value={detail.value} label={detail.label} />
                        ) : null}
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    Your registration will be confirmed after The Diabetes Centre verifies your
                    payment.
                  </p>
                </div>

                <div data-invalid={errors['paymentProof'] ? "true" : undefined}>
                  <label
                    htmlFor="paymentProof"
                    className="block text-sm font-semibold text-navy"
                  >
                    Upload Payment Screenshot <span className="text-destructive">*</span>
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Please upload a clear screenshot or receipt of your successful bank transfer so
                    our team can verify your registration. JPG, JPEG, PNG or PDF — maximum 5 MB.
                  </p>
                  <input
                    id="paymentProof"
                    name="paymentProof"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    required
                    aria-describedby={errors['paymentProof'] ? "paymentProof-error" : undefined}
                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                    className="mt-3 block w-full cursor-pointer rounded-2xl border-2 border-dashed border-brand/40 bg-tint p-4 text-sm text-navy file:mr-4 file:min-h-11 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand file:px-5 file:py-2.5 file:text-sm file:font-bold file:text-primary-foreground"
                  />
                  {file && !errors['paymentProof'] ? (
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-brand">
                      <FileUp className="h-4 w-4" aria-hidden="true" /> {file.name} attached
                    </p>
                  ) : null}
                  {errors['paymentProof'] ? (
                    <p id="paymentProof-error" role="alert" className="mt-2 text-sm text-destructive">
                      {errors['paymentProof']}
                    </p>
                  ) : null}
                </div>
              </fieldset>

              {formError ? (
                <p role="alert" className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
                  {formError}
                </p>
              ) : null}

              <div className="space-y-3">
                <button
                  id="submit-registration"
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 py-4 text-base font-bold text-primary-foreground shadow-float transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Submitting…
                    </>
                  ) : (
                    "SUBMIT REGISTRATION"
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Your registration will be reviewed by The Diabetes Centre Pakistan after payment
                  verification.
                </p>
                <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Your details are used only for masterclass registration and communication.
                </p>
              </div>
            </form>

            <aside className="order-1 space-y-4 lg:sticky lg:top-6 lg:order-2">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                  Your registration
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-navy">
                  Diabetes Control Masterclass
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {EVENT_DATE} · {EVENT_TIME}
                </p>
                <div className="mt-5 flex items-baseline justify-between border-t border-border pt-5">
                  <span className="text-sm font-semibold text-navy">Registration fee</span>
                  <span className="text-3xl font-extrabold text-brand">{EVENT_FEE}</span>
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <p className="font-semibold text-navy">Need Help With Registration?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our team is one message away.
                </p>
                <WhatsAppButton size="md" className="mt-4 w-full">
                  Chat With Us on WhatsApp
                </WhatsAppButton>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
                <p className="font-semibold text-navy">Educational programme</p>
                <p className="mt-2 leading-relaxed">
                  This masterclass is educational and does not replace individual medical
                  diagnosis, treatment or advice from your healthcare professional.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <FloatingWhatsApp />
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  name,
  error,
  required,
  type = "text",
  ...rest
}: {
  label: string;
  name: string;
  error?: string | undefined;
  required?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: "tel" | "email" | "numeric";
  autoComplete?: string;
}) {
  return (
    <div data-invalid={error ? "true" : undefined}>
      <label htmlFor={name} className="block text-sm font-semibold text-navy">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-ring/30"
        {...rest}
      />
      {error ? (
        <p id={`${name}-error`} role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-navy">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue=""
        className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-ring/30"
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
