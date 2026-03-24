import { NextRequest, NextResponse } from "next/server";
import { serverGetById } from "@/lib/bond-server-store";

/**
 * GET /api/bonds/[id] — fetch a single bond intent by referenceId
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const intent = serverGetById(params.id);
  if (!intent) {
    return NextResponse.json({ error: "Bond intent not found" }, { status: 404 });
  }
  return NextResponse.json(intent);
}
