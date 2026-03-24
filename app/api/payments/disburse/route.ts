import { NextRequest, NextResponse } from "next/server";
import { BACKEND_CONFIG } from "@/lib/system-config";

/**
 * POST /api/payments/disburse
 *
 * Leg 3 of the 3-leg bond payment flow: App-to-User (A2U) disbursement.
 *
 * Pi SDK constraint: window.Pi.createPayment() is User-to-App only.
 * After the investor's bond principal (Leg 2, U2A) is confirmed on-chain
 * and received by the App Wallet, this route initiates a server-side A2U
 * payment from the App Wallet to the issuer's Pi account.
 *
 * Pi Platform A2U payment flow:
 *   POST /v2/payments  { uid, amount, memo, metadata }  → disbursementId
 *   POST /v2/payments/{disbursementId}/complete          → TXID
 *
 * The issuer is identified by their Pi Network username. The Pi Platform
 * resolves the username to a UID internally.
 *
 * Reference: https://github.com/pi-apps/pi-platform-docs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      issuerUsername,
      bondAmountPi,
      referenceId,
      bondPaymentId,
      bondPaymentTxid,
    } = body as {
      issuerUsername:  string;
      bondAmountPi:    number;
      referenceId:     string;
      bondPaymentId?:  string;
      bondPaymentTxid?: string;
    };

    if (!issuerUsername || !bondAmountPi || !referenceId) {
      return NextResponse.json(
        { error: "issuerUsername, bondAmountPi, and referenceId are required" },
        { status: 400 }
      );
    }

    // Server-side Pi API key — required for A2U payments.
    // Set this in your Vercel project environment variables.
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "PI_API_KEY is not configured. " +
            "Add it in the Vars section of project settings.",
        },
        { status: 500 }
      );
    }

    const baseUrl = BACKEND_CONFIG.BASE_URL;

    // ── Step A: Create A2U payment ────────────────────────────────────────────
    const createRes = await fetch(`${baseUrl}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Key ${apiKey}`,
      },
      body: JSON.stringify({
        payment: {
          amount: bondAmountPi,
          memo:   `Bond principal disbursement [Testnet] — ${bondAmountPi} Pi — ref:${referenceId}`,
          metadata: {
            paymentType:     "bond_disbursement",
            referenceId,
            bondAmountPi,
            issuerUsername,
            bondPaymentId:   bondPaymentId   ?? null,
            bondPaymentTxid: bondPaymentTxid ?? null,
          },
          // Pi Platform resolves username to UID internally for A2U payments
          uid: issuerUsername,
        },
      }),
    });

    const createData = await createRes.json().catch(() => ({
      error: `A2U payment creation failed (HTTP ${createRes.status})`,
    }));

    if (!createRes.ok) {
      return NextResponse.json(
        {
          error:
            createData?.message ??
            createData?.error ??
            "Pi Platform A2U payment creation failed",
          upstream: createData,
        },
        { status: createRes.status }
      );
    }

    const disbursementId: string =
      createData.identifier ??
      createData.payment?.identifier ??
      createData.id ??
      "";

    if (!disbursementId) {
      return NextResponse.json(
        {
          error:    "Pi Platform did not return a disbursement payment ID",
          upstream: createData,
        },
        { status: 502 }
      );
    }

    // ── Step B: Complete (approve) the A2U payment ────────────────────────────
    const completeRes = await fetch(
      `${baseUrl}/v2/payments/${disbursementId}/complete`,
      {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Key ${apiKey}`,
        },
        body: JSON.stringify({
          txid: createData.transaction?.txid ?? "",
        }),
      }
    );

    const completeData = await completeRes.json().catch(() => ({
      error: `A2U completion failed (HTTP ${completeRes.status})`,
    }));

    if (!completeRes.ok) {
      // Created but not yet completed — return partial record so the client
      // can log the disbursementId and an operator can retry completion.
      return NextResponse.json(
        {
          error:
            completeData?.message ??
            completeData?.error ??
            "Pi Platform A2U completion failed",
          disbursement: {
            disbursementId,
            issuerUsername,
            amount:      bondAmountPi,
            status:      "initiated",
            initiatedAt: new Date().toISOString(),
          },
          upstream: completeData,
        },
        { status: completeRes.status }
      );
    }

    const txid: string =
      completeData.transaction?.txid ??
      createData.transaction?.txid ??
      completeData.txid ??
      "";

    const now = new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        disbursement: {
          disbursementId,
          txid:          txid || undefined,
          amount:        bondAmountPi,
          issuerUsername,
          status:        "completed",
          initiatedAt:   now,
          completedAt:   now,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Disbursement request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
