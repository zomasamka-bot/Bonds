"use client";

import Link from "next/link";
import {
  Shield,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
} from "lucide-react";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { BONDS_APP_CONFIG } from "@/lib/bonds-config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { connectionStatus, userData, authMessage, connect, disconnect } =
    usePiAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3">

        {/* App identity */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary shrink-0">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm text-foreground">
              {title ?? BONDS_APP_CONFIG.identity.name}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {subtitle ?? BONDS_APP_CONFIG.identity.domain}
            </span>
          </div>
        </Link>

        {/* Wallet connection control */}
        <div className="flex items-center gap-2 shrink-0">

          {/* IDLE — show connect button */}
          {connectionStatus === "idle" && (
            <Button size="sm" onClick={connect} className="gap-1.5 h-8 text-xs">
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          )}

          {/* CONNECTING */}
          {connectionStatus === "connecting" && (
            <Button size="sm" disabled className="gap-1.5 h-8 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting…</span>
            </Button>
          )}

          {/* CONNECTED — dropdown with user info + disconnect */}
          {connectionStatus === "connected" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs bg-transparent border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[120px] truncate">
                    {userData?.username ?? "Connected"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col space-y-0.5 min-w-0">
                      <span className="text-sm font-semibold truncate">
                        {userData?.username ?? "Pi User"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {BONDS_APP_CONFIG.identity.domain}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={disconnect}
                  className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect Wallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* ERROR — retry button */}
          {connectionStatus === "error" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={connect}
              className="gap-1.5 h-8 text-xs"
              title={authMessage}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Retry Connection</span>
              <span className="sm:hidden">Retry</span>
            </Button>
          )}

        </div>
      </div>
    </header>
  );
}
