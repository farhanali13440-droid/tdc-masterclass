import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const leadSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  whatsapp: z.string().trim().min(10).max(20).regex(/^[0-9+\-\s()]+$/),
  email: z.string().trim().email().max(255),
  city: z.string().trim().min(2).max(80),
  learningGoal: z.string().trim().max(500).nullable(),
});

async function requireAdmin(context: { claims?: Record<string, unknown> }) {
  const claims = context.claims ?? {};
  const appMetadata = (claims['app_metadata'] ?? {}) as Record<string, unknown>;
  if (appMetadata['role'] !== "admin") throw new Error("Forbidden");
}

export const createCheckoutLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => leadSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = crypto.randomUUID();
    const checkoutToken = crypto.randomUUID();
    const { error } = await supabaseAdmin.from("masterclass_registrations").insert({
      id,
      full_name: data.fullName,
      whatsapp: data.whatsapp,
      email: data.email,
      city: data.city,
      learning_goal: data.learningGoal,
      amount_pkr: 499,
      payment_proof_path: "",
      status: "Opted In",
      lead_status: "Checkout Started",
      payment_status: "Payment Pending",
      registration_status: "Opted In",
      checkout_token: checkoutToken,
    });
    if (error) throw new Error("Unable to save your details. Please try again.");
    return { id, checkoutToken };
  });

export const submitPaymentProof = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      registrationId: z.string().uuid(),
      checkoutToken: z.string().uuid(),
      paymentProofPath: z.string().min(1).max(500),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: registration, error: lookupError } = await supabaseAdmin
      .from("masterclass_registrations")
      .select("id, checkout_token")
      .eq("id", data.registrationId)
      .maybeSingle();
    if (lookupError || !registration || registration.checkout_token !== data.checkoutToken) {
      throw new Error("This checkout session is no longer valid. Please start again.");
    }
    if (!data.paymentProofPath.startsWith(data.registrationId + "/")) {
      throw new Error("Invalid payment proof.");
    }
    const { error } = await supabaseAdmin.from("masterclass_registrations").update({
      payment_proof_path: data.paymentProofPath,
      payment_submitted_at: new Date().toISOString(),
      payment_status: "Payment Submitted",
      registration_status: "Payment Pending",
      lead_status: "Payment Submitted",
      status: "Payment Submitted",
    }).eq("id", data.registrationId);
    if (error) throw new Error("Unable to submit your payment proof. Please try again.");
    return { ok: true };
  });

export const listAdminRegistrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ query: z.string().max(100).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("masterclass_registrations")
      .select("id, full_name, whatsapp, email, city, age, has_diabetes, diabetes_type, lead_status, payment_status, registration_status, created_at, payment_submitted_at, payment_proof_path, amount_pkr")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.query?.trim()) {
      const value = data.query.trim().replace(/[,%()]/g, "");
      query = query.or("full_name.ilike.%"+value+"%,whatsapp.ilike.%"+value+"%,email.ilike.%"+value+"%");
    }
    const { data: rows, error } = await query;
    if (error) throw new Error("Unable to load registrations.");
    const result = await Promise.all((rows ?? []).map(async (row) => {
      // Legacy registrations may have a screenshot without their status column
      // being updated. A submitted proof is the authoritative payment signal.
      const hasProof = Boolean(row.payment_proof_path?.trim());
      const payment_status = hasProof ? "Payment Submitted" : (row.payment_status || "Payment Pending");
      const normalized = { ...row, payment_status };
      if (!hasProof) return { ...normalized, proofUrl: null };
      const { data: signed } = await supabaseAdmin.storage.from("payment-proofs").createSignedUrl(row.payment_proof_path, 60);
      return { ...normalized, proofUrl: signed?.signedUrl ?? null };
    }));
    return result;
  });
