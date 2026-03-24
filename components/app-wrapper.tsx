"use client";

import type { ReactNode } from "react";
import { PiAuthProvider } from "@/contexts/pi-auth-context";

/**
 * AppWrapper
 *
 * Wraps the entire app with the Pi auth provider.
 * The app renders immediately regardless of connection state —
 * individual pages surface a "Connect Wallet" button via AppHeader
 * when the user is not yet authenticated.
 */
export function AppWrapper({ children }: { children: ReactNode }) {
  return <PiAuthProvider>{children}</PiAuthProvider>;
}
