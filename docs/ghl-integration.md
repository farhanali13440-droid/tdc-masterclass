# GoHighLevel (GHL) CRM Integration

Every checkout opt-in and every payment proof submission on the TDC Diabetes
Control Masterclass site is sent from the **server** to GoHighLevel. GHL
workflows then email an internal notification.

```
Browser ──server fn──> Supabase write succeeds ──> ghl_sync_events ledger claim
                                                  └─> GHL API v2 (services.leadconnectorhq.com)
                                                        1. POST /contacts/upsert  (email/phone match)
                                                        2. POST /contacts/:id/notes (audit trail)
                                                        3. POST /contacts/:id/tags  (workflow trigger)
                                                  └─> ledger marked "sent"
```

## 1. Secrets (server-only)

Set these in **Lovable → Cloud → Secrets** (never as `VITE_*`, never in `.env`):

| Secret | Value |
| --- | --- |
| `GHL_PRIVATE_INTEGRATION_TOKEN` | GHL sub-account → Settings → Private Integrations → Create. Scopes: `contacts.readonly`, `contacts.write`, `locations/customFields.readonly`, `locations/customFields.write`, `locations/tags.readonly`, `locations/tags.write` |
| `GHL_LOCATION_ID` | GHL sub-account → Settings → Business Profile → Location ID |

Optional: `GHL_API_BASE_URL` (testing only; plain http is accepted for localhost only).

If either secret is missing the site works exactly as before and logs
`[ghl] ... sync skipped`.

## 2. Database

`drizzle/migrations/0002_add_ghl_sync_events.sql` adds `public.ghl_sync_events`
(service-role only, RLS on, no public grants). `UNIQUE (registration_id, event_type)`
is the idempotency key. Existing tables are not changed.

## 3. Tags and custom fields (auto-provisioned)

On the first event the server finds or creates these in the location. Existing
fields/tags with the same name (any casing) are reused, never duplicated.

Tags: `TDC Masterclass Lead`, `TDC Masterclass Payment Submitted`, `TDC Masterclass Paid`.
`TDC Masterclass Paid` is never applied automatically: the website only knows a
payment screenshot was uploaded. The TDC team adds it after verifying the bank transfer.

| Custom field | Merge tag | Type |
| --- | --- | --- |
| TDC Product | `{{contact.tdc_product}}` | Text |
| TDC Registration ID | `{{contact.tdc_registration_id}}` | Text |
| TDC Registration Status | `{{contact.tdc_registration_status}}` | Text |
| TDC Lead Status | `{{contact.tdc_lead_status}}` | Text |
| TDC Payment Status | `{{contact.tdc_payment_status}}` | Text |
| TDC Amount (payable, after coupon) | `{{contact.tdc_amount}}` | Numerical |
| TDC Original Amount | `{{contact.tdc_original_amount}}` | Numerical |
| TDC Discount Amount | `{{contact.tdc_discount_amount}}` | Numerical |
| TDC Coupon Code | `{{contact.tdc_coupon_code}}` | Text |
| TDC Source | `{{contact.tdc_source}}` | Text |
| TDC Source URL | `{{contact.tdc_source_url}}` | Text |
| TDC Event Date | `{{contact.tdc_event_date}}` | Text |
| TDC Learning Goal | `{{contact.tdc_learning_goal}}` | Large text |
| TDC WhatsApp (exactly as typed) | `{{contact.tdc_whatsapp}}` | Text |
| TDC Opted In At (PKT) | `{{contact.tdc_opted_in_at}}` | Text |
| TDC Payment Submitted At (PKT) | `{{contact.tdc_payment_submitted_at}}` | Text |
| TDC Last Event | `{{contact.tdc_last_event}}` | Text |

Standard fields set: first/last/full name, email, phone (E.164, `03xx` → `+923xx`),
city, source = `TDC Masterclass Website`.

## 4. Event mapping

| Website action (server source of truth) | GHL tag added | Registration / Lead / Payment status sent |
| --- | --- | --- |
| Step 1 saved (`createCheckoutLead` insert OK) | TDC Masterclass Lead | Opted In / Checkout Started / Payment Pending |
| Payment screenshot submitted (`submitPaymentProof` update OK) | TDC Masterclass Payment Submitted | Payment Pending / Payment Submitted / Payment Submitted |
| 100% coupon registration submitted (amount 0) | TDC Masterclass Payment Submitted | Confirmed / Free Registration / Free (100% Coupon) |
| Bank transfer verified by TDC team (manual, in GHL) | TDC Masterclass Paid (manual) | n/a |

Amounts always come from the Supabase row, so coupons are respected.

## 5. Workflows (GHL → Automation → Workflows)

Both workflows: **Settings → Allow Re-entry: ON** (a returning person who registers
again must notify again; the website already guarantees one tag add per registration).

### Workflow A: New TDC Masterclass Lead

- Trigger: **Contact Tag**, filter **Tag Added = TDC Masterclass Lead**
- Action: **Send Internal Notification** → Email → to the TDC team
- Subject: `🔔 New TDC Masterclass Lead`
- Body:

```
New TDC Masterclass lead (checkout started, payment pending)

Name: {{contact.name}}
WhatsApp: {{contact.tdc_whatsapp}}
Email: {{contact.email}}
City: {{contact.city}}
Learning Goal: {{contact.tdc_learning_goal}}
Registration ID: {{contact.tdc_registration_id}}
Amount: PKR {{contact.tdc_amount}}
Coupon: {{contact.tdc_coupon_code}}
Source: {{contact.tdc_source}}
Page: {{contact.tdc_source_url}}
Date/time: {{contact.tdc_opted_in_at}}
```

### Workflow B: New TDC Masterclass Payment Submitted

- Trigger: **Contact Tag**, filter **Tag Added = TDC Masterclass Payment Submitted**
- Action: **Send Internal Notification** → Email → to the TDC team
- Subject: `💰 New TDC Masterclass Payment Submitted`
- Body:

```
Payment proof submitted for the TDC Masterclass

Name: {{contact.name}}
WhatsApp: {{contact.tdc_whatsapp}}
Email: {{contact.email}}
Registration ID: {{contact.tdc_registration_id}}
Amount: PKR {{contact.tdc_amount}}
Coupon: {{contact.tdc_coupon_code}}
Payment Status: {{contact.tdc_payment_status}}
Registration Status: {{contact.tdc_registration_status}}
Date/time: {{contact.tdc_payment_submitted_at}}
Product: {{contact.tdc_product}} ({{contact.tdc_event_date}})

This confirms a payment screenshot was uploaded (or a 100% coupon was used).
The bank transfer is NOT verified yet. After verifying, add the tag
"TDC Masterclass Paid" to this contact.
```

## 6. Duplicate protection and retries

- Ledger row per `(registration_id, event_type)`; `sent` rows are never delivered again.
  Claims use an optimistic lock (`attempts` compare-and-set + 90 s `locked_until`),
  so concurrent requests deliver once.
- Contacts are upserted (GHL "Allow Duplicate Contact" setting decides the match),
  so the same email/phone updates one contact.
- A tag is only removed and re-added when a **new** registration id belongs to a
  contact that already has it, giving exactly one notification per registration.
- GHL 429/5xx/network errors are retried in-request (3 tries). Failures are stored
  as `failed` and retried safely by: the payment step (lead first), every
  `/thank-you` load (unsent rows only), and the optional cron route. Max 6 attempts.
- The GHL call is time-boxed (9 s) and handed to Cloudflare `waitUntil`; it never
  throws into checkout. `/thank-you` refreshes never create new CRM events.

## 7. Optional scheduled retry

`POST /api/public/cron/ghl-sync-retry` with `Authorization: Bearer $LOVABLE_CRON_SECRET`
re-delivers failed events from the last 72 hours (e.g. every 15 minutes).

## 8. Troubleshooting

- Worker logs: search `[ghl]` (no tokens or customer PII are logged).
- Ledger: `select event_type, status, attempts, last_error from ghl_sync_events order by created_at desc;`
