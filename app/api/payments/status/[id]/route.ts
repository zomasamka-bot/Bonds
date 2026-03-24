import { NextRequest, NextResponse } from "next/server";
import { kv, kvKey } from "@/lib/kv";

/**
 * GET /api/payments/status/[id]
 *
 * Looks up a completed payment record from Upstash KV by paymentId.
 * Also accepts a referenceId — resolves to the paymentId via the ref index.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Try direct paymentId lookup first
  let record = await kv.hgetall(kvKey.payment(id));

  // If not found, treat id as a referenceId and resolve the paymentId
  if (!record) {
    const paymentId = await kv.get<string>(`bonds:payment_ref:${id}`);
    if (paymentId) {
      record = await kv.hgetall(kvKey.payment(paymentId));
    }
  }

  if (!record) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  // Fetch audit log
  const log = await kv.lrange(kvKey.paymentLog(String(record.paymentId ?? id)), 0, -1);

  return NextResponse.json({ payment: record, log }, { status: 200 });
}
