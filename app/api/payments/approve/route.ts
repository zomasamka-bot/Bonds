import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/approve
 *
 * Approves a Pi payment by calling the Pi Platform API directly:
 *   POST https://api.minepi.com/v2/payments/{paymentId}/approve
 *   Authorization: Key {PI_API_KEY}
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
  try {
    const body = await req.json();
    paymentId = body.paymentId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${PI_API_BASE}/${paymentId}/approve`, {
      method:  "POST",
      headers: {
        "Authorization": `Key ${PI_API_KEY}`,
        "Content-Type":  "application/json",
      },
    });

    const data = await upstream.json().catch(() => ({
      _raw: `HTTP ${upstream.status}`,
    }));

    if (!upstream.ok) {
      return NextResponse.json(
        { error: (data?.message as string) ?? (data?.error as string) ?? `Approval failed (HTTP ${upstream.status})`, upstream: data },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ success: true, paymentId, ...data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Approval request failed" },
      { status: 500 }
    );
  }
}
