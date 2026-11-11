import { beforeEach, expect, mock, test } from "bun:test";

let pixelReady = true;
const pixelCalls: unknown[][] = [];
const capiCalls: unknown[] = [];
mock.module("./meta-pixel-loader", () => ({ ensureMetaPixel: async () => pixelReady ? "1390192469209483" : null }));
mock.module("./meta.functions", () => ({ trackMetaEvent: async (input: unknown) => { capiCalls.push(input); return { ok: true }; } }));
const { trackMetaConversion } = await import("./meta-tracking");

beforeEach(() => {
  pixelReady = true;
  pixelCalls.length = 0;
  capiCalls.length = 0;
  const storage = () => {
    const values = new Map<string, string>();
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  };
  Object.assign(globalThis, {
    window: { location: { href: "https://example.com/checkout", search: "" }, localStorage: storage(), sessionStorage: storage(), fbq: (...args: unknown[]) => pixelCalls.push(args) },
    document: { cookie: "_fbp=fb.1.123.browser" },
  });
});

test("InitiateCheckout sends only 499 PKR and shares the browser/CAPI ID", async () => {
  await trackMetaConversion("InitiateCheckout", { sessionKey: "checkout", value: 499, currency: "PKR" });
  expect(pixelCalls[0]?.[2]).toEqual({ value: 499, currency: "PKR" });
  const request = capiCalls[0] as { data: { eventId: string } };
  expect(pixelCalls[0]?.[3]).toEqual({ eventID: request.data.eventId });
});

test("CompleteRegistration fires once despite concurrent effects and repeated payment entry", async () => {
  const options = { sessionKey: "payment:one", registrationId: "c7c7a050-1f21-4b25-8a07-97505d0edbbd" };
  await Promise.all([trackMetaConversion("CompleteRegistration", options), trackMetaConversion("CompleteRegistration", options)]);
  await trackMetaConversion("CompleteRegistration", options);
  expect(pixelCalls).toHaveLength(1);
  expect(pixelCalls[0]?.[2]).toEqual({});
});

test("Purchase fires once per registration with exactly value and currency", async () => {
  const options = { dedupeKey: "purchase:one", registrationId: "c7c7a050-1f21-4b25-8a07-97505d0edbbd", value: 499, currency: "PKR" };
  await trackMetaConversion("Purchase", options);
  await trackMetaConversion("Purchase", options);
  expect(pixelCalls).toHaveLength(1);
  expect(pixelCalls[0]?.[2]).toEqual({ value: 499, currency: "PKR" });
});

test("failed Pixel initialization does not block a later checkout retry", async () => {
  pixelReady = false;
  expect(await trackMetaConversion("InitiateCheckout", { sessionKey: "retry" })).toEqual({ sent: false });
  pixelReady = true;
  await trackMetaConversion("InitiateCheckout", { sessionKey: "retry" });
  expect(pixelCalls).toHaveLength(1);
});