"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Plus,
  ChevronRight,
  Wallet,
  Loader2,
  Shield,
  User,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import {
  getAllBondIntents,
  getStatistics,
  subscribeToStorageChanges,
  initializeStorageSync,
} from "@/lib/bond-store";
import { BONDS_APP_CONFIG } from "@/lib/bonds-config";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";

export default function HomePage() {
  const { isAuthenticated, connectionStatus, connect, userData } = usePiAuth();
  const [recentIntents, setRecentIntents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    recorded: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = () => {
    setRecentIntents(getAllBondIntents().slice(0, 5));
    setStats(getStatistics());
  };

  useEffect(() => {
    initializeStorageSync();
    const timer = setTimeout(() => {
      refreshData();
      setIsLoading(false);
    }, 500);
    const unsubscribe = subscribeToStorageChanges(refreshData);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  if (isLoading) return <LoadingState message="Loading dashboard…" />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl space-y-6">

        {/* Domain identity banner */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Operating on domain
            </span>
            <span className="text-xs font-semibold text-primary font-mono">
              {BONDS_APP_CONFIG.identity.domain}
            </span>
          </div>
          <code className="text-[10px] text-muted-foreground font-mono hidden sm:block">
            {BONDS_APP_CONFIG.release.tag}
          </code>
        </div>

        {/* Wallet status card */}
        {!isAuthenticated ? (
          /* Not connected — connect prompt */
          <div className="rounded-lg border border-border bg-card px-5 py-5 space-y-3">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Connect your Pi Wallet
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A Pi wallet connection is required to submit bond intents and
                  authorise the{" "}
                  <span className="font-mono">
                    {BONDS_APP_CONFIG.identity.domain}
                  </span>{" "}
                  governance framework. You can browse the dashboard without
                  connecting.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={connect}
              disabled={connectionStatus === "connecting"}
              className="gap-2 h-8 text-xs"
            >
              {connectionStatus === "connecting" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5" />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Connected — user identity card */
          <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20 px-5 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 shrink-0">
                  <User className="w-4 h-4 text-green-700 dark:text-green-400" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      {userData?.username ?? "Pi User"}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {BONDS_APP_CONFIG.identity.domain}
                  </p>
                </div>
              </div>
              <div className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                Session active
              </div>
            </div>
          </div>
        )}

        {/* Primary action */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground text-balance">
              Bond Intent Documentation
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty mt-1">
              Document and track bond issuance or allocation intents within
              governance frameworks on the Pi Network.
            </p>
          </div>

          <Link href="/create" className="block max-w-sm">
            <Button size="lg" className="w-full gap-2 h-12">
              <Plus className="w-5 h-5" />
              Create New Bond Intent
            </Button>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending },
            { label: "Approved", value: stats.approved },
            { label: "Recorded", value: stats.recorded },
          ].map(({ label, value }) => (
            <Card key={label} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-foreground">
                  {value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent intents */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Bond Intents</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Latest documented bond decisions
                </CardDescription>
              </div>
              {isAuthenticated && userData?.username && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">
                    {userData.username}
                  </span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentIntents.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {recentIntents.map((intent) => {
                  const bondTypeCfg = BONDS_APP_CONFIG.bondTypes.find(
                    (t) => t.value === intent.bondType
                  );
                  const statusCfg =
                    BONDS_APP_CONFIG.statusTypes[
                      intent.status as keyof typeof BONDS_APP_CONFIG.statusTypes
                    ];
                  const isPositive =
                    intent.status === "approved" ||
                    intent.status === "recorded";

                  return (
                    <Link key={intent.id} href={`/status/${intent.id}`}>
                      <div className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-accent/50 hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate text-sm">
                              {bondTypeCfg?.label ?? intent.bondType}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {intent.issuer}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-foreground">
                              {intent.amount} Pi
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(intent.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge
                            variant={isPositive ? "default" : "secondary"}
                            className="shrink-0 text-xs"
                          >
                            {statusCfg?.label ?? intent.status}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      <AppFooter />
    </div>
  );
}
