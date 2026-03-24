import { NextRequest, NextResponse } from "next/server";
import { kvLogPaymentEvent } from "@/lib/kv";

/**
 * POST /api/payments/incomplete
 *
 * Handles incomplete payment recovery from the Pi SDK authenticate callback.
 * Called server-side when Pi.authenticate discovers a payment that was
 * initiated but not completed in a previous session.
 *
 * Calls the Pi Platform complete endpoint directly with PI_API_KEY.
 * This ensures no payment is permanently stuck in an incomplete state.
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

  let body: { paymentId: string; txid?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { paymentId, txid } = body;
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }

  // If we have a txid, complete the payment; otherwise just log and approve
  const endpoint = txid ? "complete" : "approve";
  const callBody = txid ? JSON.stringify({ txid }) : undefined;

  try {
    const upstream = await fetch(`${PI_API_BASE}/${paymentId}/${endpoint}`, {
      method:  "POST",
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type":  "application/json",
      },
      ...(callBody ? { body: callBody } : {}),
    });

    const data = await upstream.json().catch(() => ({}));

    await kvLogPaymentEvent(
      paymentId,
      `INCOMPLETE_RECOVERY endpoint=${endpoint} status=${upstream.status} txid=${txid ?? "—"}`
    ).catch(() => {});

    return NextResponse.json({ success: upstream.ok, upstream: data }, {
      status: upstream.ok ? 200 : upstream.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Recovery failed";
    await kvLogPaymentEvent(paymentId, `INCOMPLETE_ERROR ${message}`).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
