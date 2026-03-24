import { Redis } from "@upstash/redis";

/**
 * Upstash Redis singleton.
 * KV_REST_API_URL and KV_REST_API_TOKEN are injected automatically
 * by the Upstash Vercel integration.
 */
export const kv = new Redis({
  url:   process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// ─────────────────────────────────────────────────────────────────────────────
// Key schema
// ─────────────────────────────────────────────────────────────────────────────

/** Full bond intent record keyed by referenceId */
export const kvKey = {
  bond:       (refId: string) => `bonds:intent:${refId}`,
  payment:    (paymentId: string) => `bonds:payment:${paymentId}`,
  paymentLog: (paymentId: string) => `bonds:log:${paymentId}`,
  index:      () => `bonds:index`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Append a timestamped entry to a payment's audit log list */
export async function kvLogPaymentEvent(
  paymentId: string,
  event: string
): Promise<void> {
  const entry = `${new Date().toISOString()} — ${event}`;
  await kv.rpush(kvKey.paymentLog(paymentId), entry);
}

/** Add referenceId to the global bond index (sorted by creation time) */
export async function kvIndexBond(
  referenceId: string,
  timestamp: number
): Promise<void> {
  await kv.zadd(kvKey.index(), { score: timestamp, member: referenceId });
}
