import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  FileUp,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";

import { TdcLogo } from "@/components/tdc/brand";
import { SiteFooter } from "@/components/tdc/site";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      {
        title: "Register — Diabetes Control Masterclass | TDC Pakistan",
      },
      {
        name: "description",
        content:
          "Register for the Diabetes Control Masterclass by The Diabetes Centre Pakistan. Pay PKR 499 via Easypaisa and upload your payment screenshot.",
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

const EASYPAISA_NUMBER = "0313 5944817";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

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

const steps = [
  {
    n: "Step 1",
    title: `Send PKR 499 through Easypaisa to ${EASYPAISA_NUMBER}`,
    icon: Wallet,
  },
  { n: "Step 2", title: "Take a screenshot of your successful payment.", icon: Smartphone },
  { n: "Step 3", title: "Upload the screenshot in the form.", icon: FileUp },
  { n: "Step 4", title: "Submit your registration.", icon: BadgeCheck },
];

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
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("masterclass_registrations")
        .insert({
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

      document.dispatchEvent(new CustomEvent("tdc:registration-submitted"));
      await navigate({ to: "/thank-you" });
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

      <main id="checkout-page" className="flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-balance text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
            Register For The Diabetes Control Masterclass
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Complete the short form below, pay PKR 499 through Easypaisa and upload your payment
            screenshot. Our team will verify and share the masterclass details with you.
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
                <legend className="text-lg font-bold text-navy">Payment — Easypaisa</legend>
                <div className="rounded-2xl bg-tint p-5">
                  <p className="text-sm font-semibold text-navy">Easypaisa</p>
                  <p className="mt-1 select-all text-2xl font-extrabold tracking-tight text-brand">
                    {EASYPAISA_NUMBER}
                  </p>
                  <ol className="mt-5 space-y-3">
                    {steps.map((step) => (
                      <li key={step.n} className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-background text-brand">
                          <step.icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <p className="min-w-0 text-sm text-navy">
                          <span className="font-bold">{step.n}: </span>
                          {step.title}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div data-invalid={errors['paymentProof'] ? "true" : undefined}>
                  <label
                    htmlFor="paymentProof"
                    className="block text-sm font-semibold text-navy"
                  >
                    Upload Payment Screenshot <span className="text-destructive">*</span>
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, JPEG, PNG or PDF — maximum 5 MB.
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
                      <BadgeCheck className="h-4 w-4" aria-hidden="true" /> {file.name} attached
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
                  Live online masterclass by The Diabetes Centre Pakistan.
                </p>
                <div className="mt-5 flex items-baseline justify-between border-t border-border pt-5">
                  <span className="text-sm font-semibold text-navy">Registration fee</span>
                  <span className="text-3xl font-extrabold text-brand">PKR 499</span>
                </div>
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
