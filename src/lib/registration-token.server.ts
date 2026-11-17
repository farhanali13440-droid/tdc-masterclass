/** Returns the registration row only when the caller holds its checkout token. */
export async function getOwnedRegistration(registrationId: string, checkoutToken: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("masterclass_registrations")
    .select("id, checkout_token, amount_pkr, payment_submitted_at")
    .eq("id", registrationId)
    .maybeSingle();
  if (!data || !data.checkout_token || data.checkout_token !== checkoutToken) return null;
  return data;
}
