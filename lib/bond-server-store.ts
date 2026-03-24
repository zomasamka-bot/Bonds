import type { BondIntent } from "@/lib/types";

/**
 * Server-side in-memory bond store.
 *
 * Shared across all API route handlers within the same serverless instance.
 * Replace Map operations with DB queries (Neon / Supabase) for durable
 * production persistence.
 */
const store = new Map<string, BondIntent>();

export function serverGetAll(): BondIntent[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function serverGetById(referenceId: string): BondIntent | undefined {
  return store.get(referenceId);
}

export function serverCreate(intent: BondIntent): { ok: true } | { ok: false; error: string } {
  if (!intent.referenceId || !intent.bondType || !intent.issuer) {
    return { ok: false, error: "referenceId, bondType, and issuer are required" };
  }
  if (store.has(intent.referenceId)) {
    return { ok: false, error: "Duplicate referenceId — intent already recorded" };
  }
  store.set(intent.referenceId, { ...intent, domain: intent.domain ?? "bonds.pi" });
  return { ok: true };
}
