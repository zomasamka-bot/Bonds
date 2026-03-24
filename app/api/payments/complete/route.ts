import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/complete
 *
 * Completes a Pi payment by calling the Pi Platform API directly:
 *   POST https://api.minepi.com/v2/payments/{paymentId}/complete
 *   Authorization: Key {PI_API_KEY}
 *   Body: { txid }
 *
 * No proxy. No intermediate backend. No client auth token forwarding.
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

  let paymentId: string;
  let txid: string;
  try {
    const body = await req.json();
    paymentId = body.paymentId;
    txid      = body.txid;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!paymentId || !txid) {
    return NextResponse.json(
      { error: "paymentId and txid are both required" },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`${PI_API_BASE}/${paymentId}/complete`, {
      method:  "POST",
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ txid }),
    });

    const data = await upstream.json().catch(() => ({
      _raw: `HTTP ${upstream.status}`,
    }));

    if (!upstream.ok) {
      return NextResponse.json(
        { error: (data?.message as string) ?? (data?.error as string) ?? `Completion failed (HTTP ${upstream.status})`, upstream: data },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ success: true, paymentId, txid, ...data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Completion request failed" },
      { status: 500 }
    );
  }
}
