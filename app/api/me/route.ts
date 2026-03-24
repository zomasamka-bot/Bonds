/**
 * POST /api/me
 *
 * Pi Developer Portal Step 10 — identity verification endpoint.
 *
 * Pi Platform /v2/me spec (official):
 *   GET https://api.minepi.com/v2/me
 *   Headers: Authorization: Key <PI_API_KEY>
 *   Query:   ?access_token=<user_access_token>
 *
 * The portal checker calls this route after Pi.authenticate() with the
 * user's access token so the app can verify identity server-side.
 * Returns the verified Pioneer user object — portal marks wallet connected.
 */

const PI_PLATFORM_ME = "https://api.minepi.com/v2/me";

async function verifyPiToken(accessToken: string) {
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) throw new Error("PI_API_KEY not configured");

  const url = `${PI_PLATFORM_ME}?access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pi Platform error ${res.status}: ${body}`);
  }

  return res.json();
}

// GET — token in Authorization: Bearer <token> header
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization") ?? "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!accessToken) {
      return Response.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const user = await verifyPiToken(accessToken);
    return Response.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// POST — token in request body (access_token | accessToken | pi_auth_token)
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const accessToken: string =
      body?.access_token ?? body?.accessToken ?? body?.pi_auth_token ?? "";

    if (!accessToken) {
      return Response.json({ error: "Missing access_token in body" }, { status: 401 });
    }

    const user = await verifyPiToken(accessToken);
    return Response.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
