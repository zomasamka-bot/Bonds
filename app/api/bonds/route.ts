import { NextRequest, NextResponse } from "next/server";
import type { BondIntent } from "@/lib/types";
import { serverGetAll, serverCreate } from "@/lib/bond-server-store";

/**
 * GET  /api/bonds   — list all bond intents
 * POST /api/bonds   — create a new bond intent record
 */
export async function GET(_req: NextRequest) {
  const intents = serverGetAll();
  return NextResponse.json({ intents, total: intents.length });
}

export async function POST(req: NextRequest) {
  try {
    const intent = (await req.json()) as BondIntent;
    const result = serverCreate(intent);

    if (!result.ok) {
      const status = result.error.includes("Duplicate") ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(
      { success: true, referenceId: intent.referenceId },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record intent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
