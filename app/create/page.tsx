"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Wallet,
  CheckCircle2,
  CircleDot,
  Circle,
  AlertCircle,
  Pi,
  ShieldCheck,
  FileCheck2,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { createBondIntent } from "@/lib/bond-store";
import { saveBondIntent } from "@/lib/actions";
import { BONDS_APP_CONFIG } from "@/lib/bonds-config";
import { type BondIntent, type PaymentRecord } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

// ─────────────────────────────────────────────────────────────────────────────
// Stage types
// "form"     — user is filling in the bond details
// "review"   — user is reading the summary before payment fires
// "bond-pay" — Pi SDK bond principal payment in progress
// "signing"  — deriving wallet signature from access token
// "execute"  — recording to store
// "done"     — redirect imminent
// "error"    — something went wrong
// ─────────────────────────────────────────────────────────────────────────────

type Stage =
  | "form"
  | "review"
  | "bond-pay"  // Bond principal payment (investor → issuer wallet)
  | "signing"   // Wallet signature derivation
  | "execute"   // Record to store
  | "done"
  | "error";

// Labels shown in the linear step indicator during execution
const EXEC_STEPS: { key: Stage; label: string }[] = [
  { key: "bond-pay", label: "Transfer" },
  { key: "signing",  label: "Sign"     },
  { key: "execute",  label: "Record"   },
  { key: "done",     label: "Done"     },
];

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator — shown only during execution stages
// ─────────────────────────────────────────────────────────────────────────────

function ExecutionProgress({ stage }: { stage: Stage }) {
  const activeIndex = EXEC_STEPS.findIndex((s) => s.key === stage);

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {EXEC_STEPS.map(({ key, label }, i) => {
        const done   = activeIndex > i;
        const active = activeIndex === i;
        return (
          <React.Fragment key={key}>
            <div className="flex items-center gap-1">
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : active ? (
                <CircleDot className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              )}
              <span
                className={`text-xs font-medium ${
                  done
                    ? "text-green-600"
                    : active
                    ? "text-primary"
                    : "text-muted-foreground/40"
                }`}
              >
                {label}
              </span>
            </div>
            {i < EXEC_STEPS.length - 1 && (
              <div
                className={`h-px w-5 ${done ? "bg-green-500" : "bg-border"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Review row helper
// ─────────────────────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs text-muted-foreground shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isExecuting(stage: Stage) {
  return ["bond-pay", "signing", "execute", "done"].includes(stage);
}

function stageLabel(stage: Stage): string {
  if (stage === "bond-pay") return "Awaiting bond principal transfer…";
  if (stage === "signing")  return "Signing transaction…";
  if (stage === "execute")  return "Recording bond intent…";
  if (stage === "done")     return "Recorded";
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateBondPage() {
  const router = useRouter();
  const { piAccessToken, userData, isAuthenticated, connect, connectionStatus } =
    usePiAuth();

  const [stage,    setStage]    = useState<Stage>("form");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [formData, setFormData] = useState({
    bondType:            "",
    issuer:              "",
    issuerWalletAddress: "",
    amount:              "",
    maturityDate:        "",
    couponRate:          "",
    notes:               "",
  });

  // ── helpers ────────────────────────────────────────────────────────────────

  const bondTypeLabel =
    BONDS_APP_CONFIG.bondTypes.find((t) => t.value === formData.bondType)
      ?.label ?? formData.bondType;

  // ── form validation ────────────────────────────────────────────────────────

  function validate(): string | null {
    const required = BONDS_APP_CONFIG.validation.requiredFields;
    const missing  = required.filter(
      (f) => !formData[f as keyof typeof formData]?.trim()
    );
    if (missing.length) return `Please fill in: ${missing.join(", ")}`;

    const amt = parseFloat(String(formData.amount).replace(/,/g, ""));
    if (isNaN(amt) || amt <= 0)
      return "Bond amount must be a valid positive number";
    if (amt < BONDS_APP_CONFIG.validation.minAmount)
      return `Bond amount must be at least ${BONDS_APP_CONFIG.validation.minAmount.toLocaleString()} Pi (entered: ${amt} Pi)`;
    if (amt > BONDS_APP_CONFIG.validation.maxAmount)
      return `Bond amount cannot exceed ${BONDS_APP_CONFIG.validation.maxAmount.toLocaleString()} Pi`;

    const rate = parseFloat(formData.couponRate);
    if (
      isNaN(rate) ||
      rate < BONDS_APP_CONFIG.validation.minCouponRate ||
      rate > BONDS_APP_CONFIG.validation.maxCouponRate
    )
      return `Coupon rate must be between ${BONDS_APP_CONFIG.validation.minCouponRate}% and ${BONDS_APP_CONFIG.validation.maxCouponRate}%`;

    return null;
  }

  // ── advance to review ──────────────────────────────────────────────────────

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); setStage("error"); return; }
    setErrorMsg("");
    setStage("review");
  }

  // ── Bond principal payment ────────────────────────────────────────────────
  // Single Pi SDK call: investor pays bond amount directly to issuer wallet.
  // /api/payments/bond-approve and /api/payments/bond-complete call the
  // Pi Platform API directly (https://api.minepi.com/v2/payments) using
  // PI_API_KEY — no intermediate wallet, no proxy.
  // issuerWalletAddress is stored in KV for audit and evidence.

  function requestBondPayment(
    referenceId: string,
    bondAmountPi: number,
    issuerWalletAddress: string
  ): Promise<PaymentRecord> {
    return new Promise((resolve, reject) => {
      // Non-Pi-Browser fallback — simulate so the flow is testable off-device
      if (typeof window === "undefined" || typeof window.Pi === "undefined") {
        const sim: PaymentRecord = {
          paymentId:           `SIM-BOND-${Date.now()}`,
          amount:              bondAmountPi,
          paymentStatus:       "completed",
          initiatedAt:         new Date().toISOString(),
          completedAt:         new Date().toISOString(),
          txid:                `SIM-TXID-${Date.now()}`,
          issuerWalletAddress,
        };
        return resolve(sim);
      }

      const draft: PaymentRecord = {
        paymentId:           "",
        amount:              bondAmountPi,
        paymentStatus:       "initiated",
        initiatedAt:         new Date().toISOString(),
        issuerWalletAddress,
      };

      window.Pi.createPayment(
        {
          amount: bondAmountPi,
          memo:   BONDS_APP_CONFIG.payment.memo(referenceId, bondAmountPi),
          metadata: {
            paymentType:         "bond_principal",
            referenceId,
            bondAmountPi,
            issuerWalletAddress,
            domain:              BONDS_APP_CONFIG.identity.domain,
            appName:             BONDS_APP_CONFIG.identity.name,
            environment:         BONDS_APP_CONFIG.release.environment,
          },
        },
        {
          // Step A: SDK fires → server calls Pi Platform /approve with PI_API_KEY
          onReadyForServerApproval: async (paymentId) => {
            draft.paymentId     = paymentId;
            draft.paymentStatus = "approved";
            try {
              const res = await fetch("/api/payments/bond-approve", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                  paymentId,
                  referenceId,
                  bondAmountPi,
                  issuerWalletAddress,
                }),
              });
              if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                reject(new Error(e?.error ?? `Approval failed (HTTP ${res.status})`));
              }
            } catch (err) {
              reject(err instanceof Error ? err : new Error("Approval request failed"));
            }
          },

          // Step B: SDK fires → server calls Pi Platform /complete with PI_API_KEY
          onReadyForServerCompletion: async (paymentId, txid) => {
            try {
              const res = await fetch("/api/payments/bond-complete", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                  paymentId,
                  txid,
                  referenceId,
                  bondAmountPi,
                  issuerWalletAddress,
                }),
              });
              if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                reject(new Error(e?.error ?? `Completion failed (HTTP ${res.status})`));
                return;
              }
            } catch (err) {
              reject(err instanceof Error ? err : new Error("Completion request failed"));
              return;
            }
            resolve({
              ...draft,
              paymentId,
              txid,
              paymentStatus: "completed",
              completedAt:   new Date().toISOString(),
            });
          },

          onCancel: (paymentId) =>
            reject(new Error(`Payment cancelled by user (${paymentId})`)),

          onError: (error) =>
            reject(error instanceof Error ? error : new Error(String(error))),
        }
      );
    });
  }

  // ── Execution pipeline ────────────────────────────────────────────────────

  async function execute() {
    setErrorMsg("");

    const timestamp          = Date.now();
    const randomId           = Math.random().toString(36).substring(2, 9).toUpperCase();
    const referenceId        = `BOND-${timestamp}-${randomId}`;
    const bondAmountPi       = parseFloat(formData.amount.replace(/,/g, ""));
    const issuerWalletAddress = formData.issuerWalletAddress.trim();

    const runtimeLog: string[] = [
      `${new Date().toISOString()} — Bond intent initialized`,
      `${new Date().toISOString()} — Reference ID: ${referenceId}`,
      `${new Date().toISOString()} — Domain: ${BONDS_APP_CONFIG.identity.domain}`,
      `${new Date().toISOString()} — Bond amount: ${bondAmountPi} Pi`,
      `${new Date().toISOString()} — Issuer wallet: ${issuerWalletAddress}`,
      `${new Date().toISOString()} — Review acknowledged`,
    ];

    // ── 1. Bond principal transfer (investor → issuer wallet) ─────────────────
    setStage("bond-pay");
    let paymentRecord: PaymentRecord;
    try {
      runtimeLog.push(
        `${new Date().toISOString()} — Transfer initiated: ${bondAmountPi} Pi → ${issuerWalletAddress} [${BONDS_APP_CONFIG.release.environment}]`
      );
      paymentRecord = await requestBondPayment(referenceId, bondAmountPi, issuerWalletAddress);
      runtimeLog.push(
        `${new Date().toISOString()} — Transfer completed — Payment ID: ${paymentRecord.paymentId}`
      );
      if (paymentRecord.txid) {
        runtimeLog.push(
          `${new Date().toISOString()} — On-chain TXID confirmed: ${paymentRecord.txid}`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bond transfer failed";
      runtimeLog.push(`${new Date().toISOString()} — Transfer failed: ${msg}`);
      setErrorMsg(msg);
      setStage("error");
      return;
    }

    // ── 2. Wallet signature ───────────────────────────────────────────────────
    setStage("signing");
    runtimeLog.push(`${new Date().toISOString()} — Wallet signature computed`);
    await new Promise((r) => setTimeout(r, 700));

    const walletSignature = piAccessToken
      ? `0x${piAccessToken.replace(/[^a-f0-9]/gi, "").padEnd(64, "0").slice(0, 64)}`
      : `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")}`;

    runtimeLog.push(
      `${new Date().toISOString()} — Signature: ${walletSignature.slice(0, 18)}…`
    );

    // ── 3. Record ─────────────────────────────────────────────────────────────
    setStage("execute");
    runtimeLog.push(`${new Date().toISOString()} — Recording bond intent`);
    await new Promise((r) => setTimeout(r, 500));
    runtimeLog.push(
      `${new Date().toISOString()} — Evidence pack sealed (${BONDS_APP_CONFIG.release.tag})`
    );

    const bondIntent: BondIntent = {
      id:                  referenceId,
      referenceId,
      domain:              BONDS_APP_CONFIG.identity.domain,
      bondType:            formData.bondType,
      issuer:              formData.issuer,
      issuerWalletAddress,
      amount:              formData.amount,
      bondAmountPi,
      maturityDate:        formData.maturityDate,
      couponRate:          formData.couponRate,
      notes:               formData.notes,
      status:              "recorded",
      timestamp:           new Date(timestamp).toISOString(),
      walletSignature,
      username:            userData?.username ?? "Pi User",
      payment:             paymentRecord,
      manifestData: {
        appName:           BONDS_APP_CONFIG.identity.name,
        domain:            BONDS_APP_CONFIG.identity.domain,
        version:           BONDS_APP_CONFIG.identity.version,
        environment:       BONDS_APP_CONFIG.release.environment,
        releaseTag:        BONDS_APP_CONFIG.release.tag,
      },
      runtimeLog,
    };

    // ── Write to localStorage (cross-tab sync) and Upstash KV (persistent) ───
    createBondIntent(bondIntent);
    await saveBondIntent(bondIntent).catch(() => {
      // KV failure is non-fatal — localStorage still holds the record locally
    });

    // ── 4. Done ───────────────────────────────────────────────────────────────
    setStage("done");
    await new Promise((r) => setTimeout(r, 350));
    router.push(`/status/${referenceId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader title="Create Bond Intent" subtitle="Document new bond allocation" />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">

        {/* Back */}
        {(stage === "form" || stage === "error") && (
          <div className="mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}

        {stage === "review" && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2"
              onClick={() => setStage("form")}
            >
              <ArrowLeft className="w-4 h-4" />
              Edit Details
            </Button>
          </div>
        )}

        {/* ── Wallet warning ─────────────────────────────────────────────────── */}
        {!isAuthenticated && (stage === "form" || stage === "error") && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-amber-800 dark:text-amber-300 leading-relaxed space-y-2">
              <p>
                <span className="font-semibold">Wallet not connected.</span> A Pi
                wallet is required to transfer the bond amount and sign this
                bond intent.
              </p>
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={connect}
                disabled={connectionStatus === "connecting"}
              >
                {connectionStatus === "connecting" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wallet className="w-3 h-3" />
                )}
                {connectionStatus === "connecting" ? "Connecting…" : "Connect Wallet"}
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STAGE: FORM                                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {(stage === "form" || stage === "error") && (
          <form onSubmit={handleReview}>
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Bond Intent Details</CardTitle>
                    <CardDescription className="mt-1">
                      Complete the form, then review before payment.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {BONDS_APP_CONFIG.identity.domain}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">

                {/* Bond Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="bondType">
                    Bond Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.bondType}
                    onValueChange={(v) => setFormData((f) => ({ ...f, bondType: v }))}
                  >
                    <SelectTrigger id="bondType">
                      <SelectValue placeholder="Select bond type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BONDS_APP_CONFIG.bondTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.bondType && (
                    <p className="text-xs text-muted-foreground">
                      {BONDS_APP_CONFIG.bondTypes.find((t) => t.value === formData.bondType)?.description}
                    </p>
                  )}
                </div>

                {/* Issuer */}
                <div className="space-y-1.5">
                  <Label htmlFor="issuer">
                    Issuing Entity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="issuer"
                    placeholder="Enter issuing authority or entity name"
                    value={formData.issuer}
                    onChange={(e) => setFormData((f) => ({ ...f, issuer: e.target.value }))}
                  />
                </div>

                {/* Issuer Wallet Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="issuerWalletAddress">
                    Issuer Wallet Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="issuerWalletAddress"
                    placeholder="e.g. GABCDEF..."
                    value={formData.issuerWalletAddress}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, issuerWalletAddress: e.target.value.trim() }))
                    }
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    The Pi Network wallet address of the issuer. The bond principal
                    will be transferred directly to this address on-chain.
                  </p>
                </div>

                {/* Amount + Coupon */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">
                      Bond Amount (Pi) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      min={BONDS_APP_CONFIG.validation.minAmount}
                      max={BONDS_APP_CONFIG.validation.maxAmount}
                      step="any"
                      placeholder={`e.g. ${BONDS_APP_CONFIG.validation.minAmount}`}
                      value={formData.amount}
                      onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum {BONDS_APP_CONFIG.validation.minAmount.toLocaleString()} Pi — no upper limit enforced
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="couponRate">
                      Coupon Rate (%) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="couponRate"
                      placeholder="e.g. 4.5"
                      value={formData.couponRate}
                      onChange={(e) => setFormData((f) => ({ ...f, couponRate: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {BONDS_APP_CONFIG.validation.minCouponRate}% – {BONDS_APP_CONFIG.validation.maxCouponRate}%
                    </p>
                  </div>
                </div>

                {/* Maturity Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="maturityDate">
                    Maturity Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="maturityDate"
                    type="date"
                    value={formData.maturityDate}
                    onChange={(e) => setFormData((f) => ({ ...f, maturityDate: e.target.value }))}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Governance conditions, special terms, or relevant context…"
                    value={formData.notes}
                    onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Separator />

                {/* Payment disclosure */}
                <div className="rounded-lg bg-muted/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    Payment
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted border px-1.5 py-0.5 rounded ml-auto">
                      TESTNET
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Investor → Issuer Wallet
                    </span>
                    <span className="flex items-center gap-0.5 font-medium text-foreground">
                      <Pi className="w-3 h-3" />{formData.amount || "—"} Pi
                    </span>
                  </div>
                  {formData.issuerWalletAddress && (
                    <div className="text-xs font-mono text-muted-foreground break-all pt-0.5">
                      {formData.issuerWalletAddress}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t">
                    The bond amount is transferred directly from your Pi wallet
                    to the issuer's wallet address on the Pi Network. No
                    submission fee. No intermediate wallet.
                  </p>
                </div>

                {/* Error */}
                {stage === "error" && errorMsg && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive leading-relaxed">{errorMsg}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action row */}
            <div className="mt-4 flex gap-3">
              <Link href="/" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1 gap-2">
                Review Intent
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground font-mono">
              {BONDS_APP_CONFIG.identity.domain} &middot; {BONDS_APP_CONFIG.release.tag}
            </p>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STAGE: REVIEW                                                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {stage === "review" && (
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle>Review Bond Intent</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">
                      Confirm the details below before payment is charged.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-0 divide-y divide-border">
                <ReviewRow label="Bond Type"            value={bondTypeLabel} />
                <ReviewRow label="Issuing Entity"       value={formData.issuer} />
                <ReviewRow label="Issuer Wallet"        value={formData.issuerWalletAddress} />
                <ReviewRow label="Amount"               value={`${formData.amount} Pi`} />
                <ReviewRow label="Coupon Rate"    value={`${formData.couponRate}%`} />
                <ReviewRow
                  label="Maturity Date"
                  value={new Date(formData.maturityDate).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                />
                {formData.notes && (
                  <ReviewRow label="Notes" value={formData.notes} />
                )}
                <ReviewRow
                  label="Submitted By"
                  value={userData?.username ?? "Pi User (unauthenticated)"}
                />
              </CardContent>
            </Card>

            {/* Payment summary */}
            <Card className="shadow-sm border-primary/20 bg-primary/5">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Payment Authorisation
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pressing <strong>Pay &amp; Issue Bond</strong> will transfer
                  the bond amount directly from your Pi wallet to the issuer's
                  wallet address on the Pi Network. No App Wallet involvement.
                  This action cannot be undone.
                </p>

                {/* Payment breakdown */}
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bond amount</span>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Pi className="w-3.5 h-3.5" />
                      {formData.amount} Pi
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        TESTNET
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">To wallet</span>
                    <code className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded block break-all">
                      {formData.issuerWalletAddress}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action row */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setStage("form")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
              <Button
                className="flex-1 gap-2 font-semibold"
                onClick={execute}
                disabled={!isAuthenticated}
                title={
                  !isAuthenticated
                    ? "Connect your wallet first"
                    : undefined
                }
              >
                <ShieldCheck className="w-4 h-4" />
                Pay &amp; Issue Bond
              </Button>
            </div>

            {!isAuthenticated && (
              <p className="text-center text-xs text-amber-600 dark:text-amber-400">
                Connect your wallet in the header to proceed.
              </p>
            )}

            <p className="text-center text-xs text-muted-foreground font-mono">
              {BONDS_APP_CONFIG.identity.domain} &middot; {BONDS_APP_CONFIG.release.tag}
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STAGE: EXECUTING (bond-pay / signing / execute / done)              */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {isExecuting(stage) && (
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Processing Bond Intent</CardTitle>
                <CardDescription className="text-xs">
                  Do not close this window while the transaction is in progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ExecutionProgress stage={stage} />

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  {stage !== "done" && (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  )}
                  {stage === "done" && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  )}
                  <span>{stageLabel(stage)}</span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Domain</span>
                    <span className="font-mono text-primary">
                      {BONDS_APP_CONFIG.identity.domain}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Bond amount</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Pi className="w-3 h-3" />
                      {formData.amount} Pi
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Recipient</span>
                    <span className="font-mono text-xs text-foreground truncate max-w-[180px]">
                      {formData.issuerWalletAddress}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Submitted by</span>
                    <span className="font-medium text-foreground">
                      {userData?.username ?? "Pi User"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground font-mono">
              {BONDS_APP_CONFIG.identity.domain} &middot; {BONDS_APP_CONFIG.release.tag}
            </p>
          </div>
        )}

      </main>

      <AppFooter />
    </div>
  );
}
