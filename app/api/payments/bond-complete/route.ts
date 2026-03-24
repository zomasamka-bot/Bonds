import { NextRequest, NextResponse } from "next/server";
import { kv, kvKey, kvLogPaymentEvent } from "@/lib/kv";

/**
 * POST /api/payments/bond-complete
 *
 * Called by the Pi SDK onReadyForServerCompletion callback.
 *
 * Completes the payment by calling the Pi Platform API directly:
 *   POST https://api.minepi.com/v2/payments/{paymentId}/complete
 *   Authorization: Key {PI_API_KEY}
 *   Body: { txid }
 *
 * No intermediate wallet. No proxy. Direct Pi Platform call.
 * The TXID is the on-chain proof of the direct investor → issuer transfer.
 *
 * Persists the full payment record (paymentId, txid, status, timestamps,
 * issuerWalletAddress, referenceId, bondAmountPi) to Upstash KV.
 */

const PI_API_BASE = "https://api.minepi.com/v2/payments";

export async function POST(req: NextRequest) {
  const PI_API_KEY = process.env.PI_API_KEY;
  if (!PI_API_KEY) {
    return NextResponse.json(
      { error: "PI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: {
    paymentId:            string;
    txid:                 string;
    referenceId?:         string;
    bondAmountPi?:        number;
    issuerWalletAddress?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { paymentId, txid, referenceId, bondAmountPi, issuerWalletAddress } = body;

  if (!paymentId || !txid) {
    return NextResponse.json(
      { error: "paymentId and txid are both required" },
      { status: 400 }
    );
  }

  // ── 1. Call Pi Platform directly ────────────────────────────────────────────
  let upstreamData: Record<string, unknown> = {};
  try {
    const upstream = await fetch(`${PI_API_BASE}/${paymentId}/complete`, {
      method:  "POST",
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ txid }),
    });

    upstreamData = await upstream.json().catch(() => ({
      _raw: `HTTP ${upstream.status} — no JSON body`,
    }));

    if (!upstream.ok) {
      await kvLogPaymentEvent(
        paymentId,
        `COMPLETE_FAILED txid=${txid} status=${upstream.status} ref=${referenceId ?? "—"}`
      ).catch(() => {});
      return NextResponse.json(
        {
          error:    (upstreamData?.message as string) ?? (upstreamData?.error as string) ?? `Pi Platform completion failed (HTTP ${upstream.status})`,
          upstream: upstreamData,
        },
        { status: upstream.status }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Completion fetch failed";
    await kvLogPaymentEvent(paymentId, `COMPLETE_ERROR ${message}`).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // ── 2. Persist full completed payment record to Upstash KV ─────────────────
  const completedAt = new Date().toISOString();

  const paymentRecord = {
    paymentId,
    txid,
    referenceId:         referenceId         ?? null,
    amount:              bondAmountPi         ?? null,
    bondAmountPi:        bondAmountPi         ?? null,
    issuerWalletAddress: issuerWalletAddress  ?? null,
    paymentStatus:       "completed",
    completedAt,
  };

  await Promise.all([
    // Full payment hash in KV
    kv.hset(kvKey.payment(paymentId), paymentRecord),
    // Audit log entry
    kvLogPaymentEvent(
      paymentId,
      `COMPLETED txid=${txid} ref=${referenceId ?? "—"} amount=${bondAmountPi ?? "—"} Pi issuer=${issuerWalletAddress ?? "—"}`
    ),
    // Cross-index: referenceId → paymentId (for bond intent lookup)
    referenceId
      ? kv.set(`bonds:payment_ref:${referenceId}`, paymentId)
      : Promise.resolve(),
  ]).catch(() => {
    // KV failure is non-fatal — payment is already completed on Pi Platform
  });

  return NextResponse.json(
    {
      success:             true,
      paymentId,
      txid,
      paymentStatus:       "completed",
      completedAt,
      issuerWalletAddress: issuerWalletAddress ?? null,
      ...upstreamData,
    },
    { status: 200 }
  );
}
