"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
  Download,
  Pi,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import {
  getBondIntent as getBondIntentLocal,
  subscribeToStorageChanges,
  initializeStorageSync,
} from "@/lib/bond-store";
import { getBondIntent as getBondIntentKV } from "@/lib/actions";
import { BONDS_APP_CONFIG } from "@/lib/bonds-config";
import type { BondIntent } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { AppFooter } from "@/components/app-footer";

export default function StatusPage() {
  const params = useParams();
  const router = useRouter();
  const [bondIntent, setBondIntent] = useState<BondIntent | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    initializeStorageSync();

    const refresh = () => {
      const intent = getBondIntentLocal(id);
      if (intent) setBondIntent(intent);
    };

    const load = async () => {
      // 1. Try localStorage first (instant, same-device)
      const local = getBondIntentLocal(id);
      if (local) {
        setBondIntent(local);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to Upstash KV (cross-device, Vercel-persisted)
      try {
        const remote = await getBondIntentKV(id);
        if (remote) {
          setBondIntent(remote);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
      setIsLoading(false);
    };

    // Small delay so the record is flushed to storage before we read
    const timer = setTimeout(load, 300);

    const unsubscribe = subscribeToStorageChanges(refresh);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [params.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportEvidencePack = () => {
    if (!bondIntent) return;
    const pack = {
      meta: {
        exportedAt: new Date().toISOString(),
        domain: BONDS_APP_CONFIG.identity.domain,
        appVersion: BONDS_APP_CONFIG.identity.version,
        releaseTag: BONDS_APP_CONFIG.release.tag,
      },
      referenceId: bondIntent.referenceId,
      domain: bondIntent.domain,
      timestamp: bondIntent.timestamp,
      status: bondIntent.status,
      submittedBy: bondIntent.username,
      bondDetails: {
        type: bondIntent.bondType,
        issuer: bondIntent.issuer,
        amount: bondIntent.amount,
        maturityDate: bondIntent.maturityDate,
        couponRate: bondIntent.couponRate,
        notes: bondIntent.notes,
      },
      walletSignature:     bondIntent.walletSignature,
      issuerWalletAddress: bondIntent.issuerWalletAddress ?? null,
      payment:             bondIntent.payment ?? null,
      manifest:            bondIntent.manifestData,
      runtimeLog:          bondIntent.runtimeLog,
    };

    const blob = new Blob([JSON.stringify(pack, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidence-pack-${bondIntent.referenceId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <LoadingState message="Loading bond intent…" />;

  if (notFound || !bondIntent) {
    return (
      <ErrorState
        title="Bond Intent Not Found"
        message="The requested bond intent could not be located."
        onBack={() => router.push("/")}
      />
    );
  }

  const isPositive =
    bondIntent.status === "approved" || bondIntent.status === "recorded";
  const statusConfig =
    BONDS_APP_CONFIG.statusTypes[
      bondIntent.status as keyof typeof BONDS_APP_CONFIG.statusTypes
    ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        title="Bond Intent Status"
        subtitle="Evidence Pack & Audit Trail"
      />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Back */}
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Status banner */}
        <div
          className={`mb-6 p-4 md:p-5 rounded-lg border shadow-sm ${
            isPositive
              ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/50"
              : "bg-secondary/20 border-secondary"
          }`}
        >
          <div className="flex items-start md:items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {isPositive ? (
                <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="w-7 h-7 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground">
                  {bondIntent.status === "recorded" &&
                    (bondIntent.payment?.paymentStatus === "completed"
                      ? "Bond Executed — Principal Transferred"
                      : "Intent Recorded")}
                  {bondIntent.status === "approved" && "Intent Approved"}
                  {bondIntent.status === "pending" && "Pending Review"}
                  {bondIntent.status === "rejected" && "Intent Rejected"}
                </h2>
                <p className="text-xs text-muted-foreground font-mono">
                  {bondIntent.referenceId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isPositive ? "default" : "secondary"}
                className="text-xs px-3 py-1 shrink-0"
              >
                {statusConfig?.label.toUpperCase() ??
                  bondIntent.status.toUpperCase()}
              </Badge>
              <Button
                onClick={exportEvidencePack}
                variant="outline"
                size="sm"
                className="gap-1.5 bg-transparent text-xs h-8"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Evidence Pack cards */}
        <div className="space-y-4">

          {/* Reference Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Reference Information</CardTitle>
              <CardDescription className="text-xs">
                Unique identifier, domain binding, and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground font-medium">
                  Reference ID
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-muted px-3 py-2 rounded flex-1 break-all leading-relaxed">
                    {bondIntent.referenceId}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-transparent h-9 w-9"
                    onClick={() => copyToClipboard(bondIntent.referenceId)}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Domain
                  </div>
                  <div className="text-sm font-medium text-primary font-mono">
                    {bondIntent.domain ?? BONDS_APP_CONFIG.identity.domain}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Timestamp
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {new Date(bondIntent.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Submitted By
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {bondIntent.username ?? "Anonymous"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bond Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bond Details</CardTitle>
              <CardDescription className="text-xs">
                Complete bond intent information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Bond Type
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {BONDS_APP_CONFIG.bondTypes.find(
                      (t) => t.value === bondIntent.bondType
                    )?.label ?? bondIntent.bondType}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Issuing Entity
                  </div>
                  <div className="text-sm font-medium text-foreground truncate">
                    {bondIntent.issuer}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Amount
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {bondIntent.amount} Pi
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Coupon Rate
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {bondIntent.couponRate}%
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <div className="text-xs text-muted-foreground font-medium">
                    Maturity Date
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {new Date(bondIntent.maturityDate).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </div>
                </div>
              </div>

              {bondIntent.notes && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground font-medium">
                      Additional Notes
                    </div>
                    <div className="text-xs text-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
                      {bondIntent.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Bond Transfer: Investor → Issuer Wallet (direct, no intermediary) ── */}
          {bondIntent.payment && (
            <Card className="shadow-sm border-green-200 dark:border-green-900/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Bond Transfer — Principal Payment
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Investor → Issuer Wallet — direct Pi Network transfer, no intermediate wallet
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      bondIntent.payment.paymentStatus === "completed"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {bondIntent.payment.paymentStatus === "completed"
                      ? "EXECUTED"
                      : bondIntent.payment.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Payment ID */}
                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground font-medium">
                    Payment ID
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-3 py-2 rounded flex-1 break-all leading-relaxed">
                      {bondIntent.payment.paymentId}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 bg-transparent h-9 w-9"
                      onClick={() => copyToClipboard(bondIntent.payment!.paymentId)}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* On-chain TXID */}
                {bondIntent.payment.txid && (
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground font-medium">
                      On-chain TXID
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-3 py-2 rounded flex-1 break-all leading-relaxed">
                        {bondIntent.payment.txid}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 bg-transparent h-9 w-9"
                        onClick={() => copyToClipboard(bondIntent.payment!.txid!)}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Issuer wallet */}
                {bondIntent.payment.issuerWalletAddress && (
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground font-medium">
                      Recipient Wallet (Issuer)
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-3 py-2 rounded flex-1 break-all leading-relaxed">
                        {bondIntent.payment.issuerWalletAddress}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 bg-transparent h-9 w-9"
                        onClick={() => copyToClipboard(bondIntent.payment!.issuerWalletAddress!)}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Amounts + timestamps */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Amount</div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      <Pi className="w-3.5 h-3.5" />
                      {bondIntent.payment.amount} Pi
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Initiated</div>
                    <div className="text-xs text-foreground">
                      {new Date(bondIntent.payment.initiatedAt).toLocaleString()}
                    </div>
                  </div>
                  {bondIntent.payment.completedAt && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">Completed</div>
                      <div className="text-xs text-foreground">
                        {new Date(bondIntent.payment.completedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The bond principal was transferred directly from the
                    investor's Pi wallet to the issuer's wallet address on-chain.
                    No intermediate wallet. No submission fee.
                  </p>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Wallet Signature */}
          {bondIntent.walletSignature && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Wallet Signature</CardTitle>
                <CardDescription className="text-xs">
                  Cryptographic proof of authorization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <code className="text-xs font-mono break-all leading-relaxed block">
                    {bondIntent.walletSignature}
                  </code>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Runtime Log */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Runtime Log</CardTitle>
              <CardDescription className="text-xs">
                Complete system execution trace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-3 rounded-lg space-y-2 max-h-60 overflow-y-auto">
                {bondIntent.runtimeLog.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-xs font-mono text-muted-foreground break-all flex-1 leading-relaxed">
                      {entry}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Manifest */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Application Manifest</CardTitle>
              <CardDescription className="text-xs">
                Environment, domain binding, and version information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Application
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {bondIntent.manifestData.appName}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Domain
                  </div>
                  <div className="text-sm font-medium text-primary font-mono">
                    {bondIntent.manifestData.domain ??
                      BONDS_APP_CONFIG.identity.domain}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Version
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {bondIntent.manifestData.version}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Environment
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {bondIntent.manifestData.environment}
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-xs text-muted-foreground font-medium">
                    Release Tag
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {bondIntent.manifestData.releaseTag ??
                      BONDS_APP_CONFIG.release.tag}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer action */}
        <div className="mt-6 space-y-3">
          <Link href="/">
            <Button variant="outline" className="w-full bg-transparent">
              Return to Dashboard
            </Button>
          </Link>
          <p className="text-center text-xs text-muted-foreground font-mono">
            {BONDS_APP_CONFIG.identity.domain} &middot;{" "}
            {BONDS_APP_CONFIG.release.tag}
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
