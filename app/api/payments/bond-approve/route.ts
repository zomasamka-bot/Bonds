import { NextRequest, NextResponse } from "next/server";
import { kv, kvKey, kvLogPaymentEvent } from "@/lib/kv";

/**
 * POST /api/payments/bond-approve
 *
 * Called by the Pi SDK onReadyForServerApproval callback.
 *
 * Approves the payment by calling the Pi Platform API directly:
 *   POST https://api.minepi.com/v2/payments/{paymentId}/approve
 *   Authorization: Key {PI_API_KEY}
 *
 * No intermediate wallet. No proxy. Direct Pi Platform call.
 * Investor → Issuer wallet routing is handled by the Pi Network on-chain.
 *
 * Records the approval event to Upstash KV.
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
    referenceId?:         string;
    bondAmountPi?:        number;
    issuerWalletAddress?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { paymentId, referenceId, bondAmountPi, issuerWalletAddress } = body;

  if (!paymentId) {
    return NextResponse.json(
      { error: "paymentId is required" },
      { status: 400 }
    );
  }

  // ── 1. Call Pi Platform directly ────────────────────────────────────────────
  let upstreamData: Record<string, unknown> = {};
  try {
    const upstream = await fetch(`${PI_API_BASE}/${paymentId}/approve`, {
      method:  "POST",
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type":  "application/json",
      },
    });

    upstreamData = await upstream.json().catch(() => ({
      _raw: `HTTP ${upstream.status} — no JSON body`,
    }));

    if (!upstream.ok) {
      await kvLogPaymentEvent(
        paymentId,
        `APPROVE_FAILED status=${upstream.status} ref=${referenceId ?? "—"}`
      ).catch(() => {});
      return NextResponse.json(
        {
          error:    (upstreamData?.message as string) ?? (upstreamData?.error as string) ?? `Pi Platform approval failed (HTTP ${upstream.status})`,
          upstream: upstreamData,
        },
        { status: upstream.status }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Approval fetch failed";
    await kvLogPaymentEvent(paymentId, `APPROVE_ERROR ${message}`).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // ── 2. Persist stub + audit log to Upstash KV ───────────────────────────────
  const approvedAt = new Date().toISOString();
  await Promise.all([
    kv.hset(kvKey.payment(paymentId), {
      paymentId,
      referenceId:         referenceId  ?? null,
      bondAmountPi:        bondAmountPi ?? null,
      issuerWalletAddress: issuerWalletAddress ?? null,
      paymentStatus:       "approved",
      approvedAt,
    }),
    kvLogPaymentEvent(
      paymentId,
      `APPROVED ref=${referenceId ?? "—"} amount=${bondAmountPi ?? "—"} Pi issuer=${issuerWalletAddress ?? "—"}`
    ),
  ]).catch(() => {
    // KV failure is non-fatal — payment is already approved on Pi Platform
  });

  return NextResponse.json(
    {
      success:             true,
      paymentId,
      paymentStatus:       "approved",
      approvedAt,
      issuerWalletAddress: issuerWalletAddress ?? null,
      ...upstreamData,
    },
    { status: 200 }
  );
}
