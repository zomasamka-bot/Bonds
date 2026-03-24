"use server";

import { kv, kvKey, kvIndexBond } from "@/lib/kv";
import { type BondIntent } from "@/lib/types";

/**
 * saveBondIntent
 *
 * Persists a completed bond intent to Upstash KV.
 * Called from create/page.tsx after the Pi payment resolves.
 * Writes the full BondIntent object and adds it to the sorted index.
 */
export async function saveBondIntent(intent: BondIntent): Promise<void> {
  const ts = intent.timestamp
    ? new Date(intent.timestamp).getTime()
    : Date.now();

  await Promise.all([
    // Full record stored as a JSON string
    kv.set(kvKey.bond(intent.referenceId), JSON.stringify(intent)),
    // Add to sorted index (score = creation timestamp for ordered retrieval)
    kvIndexBond(intent.referenceId, ts),
  ]);
}

/**
 * getBondIntent
 *
 * Retrieves a BondIntent from Upstash KV by referenceId.
 * Returns null if not found.
 */
export async function getBondIntent(
  referenceId: string
): Promise<BondIntent | null> {
  const raw = await kv.get<string>(kvKey.bond(referenceId));
  if (!raw) return null;
  try {
    return typeof raw === "string"
      ? (JSON.parse(raw) as BondIntent)
      : (raw as BondIntent);
  } catch {
    return null;
  }
}

/**
 * getAllBondIntentsFromKV
 *
 * Retrieves all bond intents from Upstash KV, ordered by creation time desc.
 * Used by the dashboard to list all recorded intents.
 */
export async function getAllBondIntentsFromKV(): Promise<BondIntent[]> {
  // Get all referenceIds from the sorted index, newest first
  const refs = await kv.zrange(kvKey.index(), 0, -1, { rev: true });
  if (!refs || refs.length === 0) return [];

  const records = await Promise.all(
    refs.map((ref) => getBondIntent(String(ref)))
  );

  return records.filter((r): r is BondIntent => r !== null);
}
