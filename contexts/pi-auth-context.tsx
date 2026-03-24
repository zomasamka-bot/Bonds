"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { PI_NETWORK_CONFIG, BACKEND_URLS } from "@/lib/system-config";
import { api, setApiAuthToken } from "@/lib/api";
import {
  initializeGlobalPayment,
  checkIncompletePayments,
} from "@/lib/pi-payment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoginDTO = {
  id: string;
  username: string;
  credits_balance: number;
  terms_accepted: boolean;
  app_id: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price_in_pi: number;
  total_quantity: number;
  is_active: boolean;
  created_at: string;
};

export type ProductList = {
  products: Product[];
};

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

interface PiAuthContextType {
  isAuthenticated: boolean;
  authMessage: string;
  connectionStatus: ConnectionStatus;
  hasError: boolean;
  piAccessToken: string | null;
  userData: LoginDTO | null;
  appId: string | null;
  products: Product[] | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Re-run SDK init + authenticate — alias for connect(), exposed for error-screen retry button. */
  reinitialize: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Session storage keys
// ---------------------------------------------------------------------------

const SESSION_TOKEN_KEY = "bonds_pi_access_token";
const SESSION_USER_KEY  = "bonds_pi_user_data";
const SESSION_APPID_KEY = "bonds_pi_app_id";

function saveSession(token: string, user: LoginDTO, appId: string) {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(SESSION_APPID_KEY, appId);
  } catch {
    // sessionStorage unavailable — non-fatal
  }
}

function loadSession(): { token: string; user: LoginDTO; appId: string } | null {
  try {
    const token  = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const raw    = sessionStorage.getItem(SESSION_USER_KEY);
    const appId  = sessionStorage.getItem(SESSION_APPID_KEY);
    if (token && raw && appId) {
      return { token, user: JSON.parse(raw) as LoginDTO, appId };
    }
  } catch {
    // Non-fatal
  }
  return null;
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_APPID_KEY);
  } catch {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detects whether we are running in a Pi sandbox / Developer Portal context.
 *
 * Correct detection order (verified against official Pi docs and issue #455):
 *
 * 1. NEXT_PUBLIC_PI_SANDBOX env var — explicit operator override.
 * 2. window.location.hostname === "sandbox.minepi.com" — the Pi Developer
 *    Portal Step 10 checker opens the app inside the sandbox host. This is
 *    the most reliable runtime signal.
 * 3. window.location.hostname contains "localhost" or "127.0.0.1" — local
 *    development always needs sandbox: true (per official docs pattern:
 *    `process.env.NODE_ENV !== 'production'`).
 * 4. PI_NETWORK_CONFIG.SANDBOX static fallback (false in production).
 *
 * NOTE: The "?sandbox=true" URL param and "__PI_SDK_SANDBOX__" global are
 * NOT part of the official Pi SDK API and must not be used for detection.
 */
function getSandboxFlag(): boolean {
  // 1. Explicit env override
  const envVal = process.env.NEXT_PUBLIC_PI_SANDBOX;
  if (envVal === "true")  return true;
  if (envVal === "false") return false;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // 2. Pi Developer Portal Step 10 sandbox host
    if (hostname === "sandbox.minepi.com" || hostname.endsWith(".sandbox.minepi.com")) {
      return true;
    }

    // 3. Local / development environments always use sandbox
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.includes(".local") ||
      // Vercel preview deployments (non-production domain)
      (hostname.endsWith(".vercel.app") && !hostname.startsWith("bonds."))
    ) {
      return true;
    }
  }

  // 4. Static config fallback
  return PI_NETWORK_CONFIG.SANDBOX;
}

/**
 * Ensures window.Pi is present, then calls Pi.init() exactly once per page
 * session.
 *
 * KEY RULES (from Pi SDK docs and real-world issue debugging):
 *
 * - Pi Browser: window.Pi is injected natively BEFORE the page loads.
 *   We must NOT call Pi.init() with the wrong sandbox value — Pi Browser
 *   runs in production mode, so sandbox must be false.
 *
 * - Developer Portal Step 10 / sandbox.minepi.com: window.Pi is provided
 *   by the SDK script tag we added in <head>. Must call Pi.init() with
 *   sandbox: true or the SDK logs "SDKMessaging instantiated on Pi
 *   environment: production" and wallet connection fails.
 *
 * - Local dev / Vercel preview: Same as portal — sandbox: true required.
 *
 * - Pi.init() is NOT async in the Pi SDK public API. The official docs show
 *   it called synchronously. We call it synchronously (no await) and wrap
 *   in try/catch for "already initialized" errors from Pi Browser.
 *
 * - We use window.__piSdkInitialized (not a module-level variable) so the
 *   flag resets on true page navigations but survives React StrictMode's
 *   double-mount in the same page session.
 */
async function initPiSDKOnce(): Promise<void> {
  if (typeof window === "undefined") return;

  // Guard: already initialized in this page session.
  if ((window as any).__piSdkInitialized === true) return;

  // Step 1 — wait for window.Pi to be available.
  // In Pi Browser it is already present synchronously.
  // In portal / local dev the <script> tag in layout.tsx loads it async.
  if (typeof window.Pi === "undefined") {
    // The script tag is already in <head> (added via layout.tsx).
    // Poll until the SDK assigns window.Pi, or timeout.
    await new Promise<void>((resolve, reject) => {
      if (typeof window.Pi !== "undefined") { resolve(); return; }
      const MAX_WAIT_MS = 10_000;
      const POLL_MS     = 100;
      let   elapsed     = 0;
      const id = setInterval(() => {
        if (typeof window.Pi !== "undefined") {
          clearInterval(id);
          resolve();
          return;
        }
        elapsed += POLL_MS;
        if (elapsed >= MAX_WAIT_MS) {
          clearInterval(id);
          reject(new Error(
            "Pi SDK did not load within 10 s. " +
            "Please open this app inside Pi Browser or the Pi Developer Portal sandbox."
          ));
        }
      }, POLL_MS);
    });
  }

  // Mark initialized BEFORE the synchronous Pi.init() call so that a
  // concurrent call (React StrictMode double-mount) returns early.
  (window as any).__piSdkInitialized = true;

  // Step 2 — call Pi.init() SYNCHRONOUSLY (no await).
  // The official SDK docs show this as a synchronous call.
  // Awaiting it causes hangs in some Pi Browser versions.
  try {
    window.Pi.init({ version: "2.0", sandbox: getSandboxFlag() });
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    // Pi Browser native shell may have already called init internally.
    // "already initialized" is safe to ignore — SDK is ready.
    if (!msg.includes("already initialized") && !msg.includes("already been initialized")) {
      // Unexpected error — reset flag so next connect() attempt retries.
      (window as any).__piSdkInitialized = false;
      throw err;
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "An unexpected error occurred. Please try again.";
  const msg = error.message;
  if (msg.includes("SDK") || msg.includes("script"))
    return "Could not load Pi Network SDK. Please open this app inside Pi Browser.";
  if (msg.includes("authenticate"))
    return "Pi Network authentication failed. Please try again.";
  if (msg.includes("login"))
    return "Backend authentication failed. Please try again later.";
  return `Authentication error: ${msg}`;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [authMessage,      setAuthMessage]      = useState("Connect your Pi Wallet to continue.");
  const [piAccessToken,    setPiAccessToken]    = useState<string | null>(null);
  const [userData,         setUserData]         = useState<LoginDTO | null>(null);
  const [appId,            setAppId]            = useState<string | null>(null);
  const [products,         setProducts]         = useState<Product[] | null>(null);

  // ---------------------------------------------------------------------------
  // Eager SDK init + session restore on first mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Initialize the Pi SDK exactly once on mount.
    // Required for Pi Developer Portal Step 10 wallet detection check —
    // the portal checker expects Pi.init() to fire on page load automatically.
    // The _piInitialized flag in initPiSDKOnce prevents double-init which
    // causes the broken postMessage channel error.
    initPiSDKOnce();

    const saved = loadSession();
    if (!saved) return;

    // Re-inject the auth token into the api client
    setApiAuthToken(saved.token);
    setPiAccessToken(saved.token);
    setUserData(saved.user);
    setAppId(saved.appId);
    setConnectionStatus("connected");
    setAuthMessage("Connected");

    // Re-register global payment handler if SDK already present
    if (typeof window !== "undefined" && typeof window.Pi !== "undefined") {
      initializeGlobalPayment();
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch products once appId is known
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!appId) return;
    api
      .get<ProductList>(BACKEND_URLS.GET_PRODUCTS(appId))
      .then(({ data }) => setProducts(data?.products ?? []))
      .catch(() => {
        // Non-fatal
      });
  }, [appId]);

  // ---------------------------------------------------------------------------
  // Explicit connect — only called when user presses "Connect Wallet"
  // ---------------------------------------------------------------------------
  const connect = useCallback(async () => {
    if (connectionStatus === "connecting") return;

    setConnectionStatus("connecting");
    setAuthMessage("Loading Pi Network SDK…");

    try {
      // 1. Load + init SDK (guarded — Pi.init() fires at most once per page load).
      // If retrying after an error, reset the flag so init runs again with the
      // correct sandbox value (the previous attempt may have failed mid-init).
      if (connectionStatus === "error" && typeof window !== "undefined") {
        (window as any).__piSdkInitialized = false;
      }
      await initPiSDKOnce();
      if (typeof window.Pi === "undefined") {
        throw new Error("Pi SDK failed to load. Please open this app inside Pi Browser.");
      }

      // 3. Authenticate — request wallet_address scope so Step 10 can confirm
      // wallet connectivity. username + payments are required for bond flow.
      setAuthMessage("Requesting wallet authentication…");
      const piAuthResult = await window.Pi.authenticate(
        ["username", "payments", "wallet_address"],
        async (payment) => {
          await checkIncompletePayments(payment);
        }
      );

      if (!piAuthResult?.accessToken) {
        throw new Error("authenticate: No access token received from Pi Network");
      }

      // 4. Login to backend
      // In sandbox mode (Pi Developer Portal Step 10) the App Studio backend
      // is not reachable from the portal checker environment. Bypass it entirely:
      // verify the token through our own /api/me route which calls the Pi
      // Platform /v2/me directly with PI_API_KEY, then build the session locally.
      setAuthMessage("Signing in to Bonds…");

      const token = piAuthResult.accessToken;
      let user: LoginDTO;
      let newAppId: string;

      if (getSandboxFlag()) {
        // Sandbox path — verify token via our own backend, no App Studio call
        const meRes = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token }),
        });
        if (!meRes.ok) throw new Error("Pi identity verification failed");
        const piUser = await meRes.json();
        // Construct a compatible LoginDTO from the Pi Platform user object
        user = {
          id:               piUser.uid ?? piUser.user?.uid ?? "sandbox",
          username:         piUser.username ?? piAuthResult.user?.username ?? "pioneer",
          credits_balance:  0,
          terms_accepted:   true,
          app_id:           piUser.app_id ?? "sandbox",
        };
        newAppId = user.app_id;
      } else {
        // Production path — use App Studio backend as normal
        const loginRes = await api.post<LoginDTO>(BACKEND_URLS.LOGIN, {
          pi_auth_token: token,
        });
        user     = loginRes.data;
        newAppId = user.app_id;
      }

      // Persist to sessionStorage so a page refresh restores the session
      saveSession(token, user, newAppId);

      setPiAccessToken(token);
      setApiAuthToken(token);
      setUserData(user);
      setAppId(newAppId);

      // 5. Register global payment handler
      initializeGlobalPayment();

      setConnectionStatus("connected");
      setAuthMessage("Connected");
    } catch (err) {
      setConnectionStatus("error");
      setAuthMessage(getErrorMessage(err));
    }
  }, [connectionStatus]);

  // ---------------------------------------------------------------------------
  // Explicit disconnect
  // ---------------------------------------------------------------------------
  const disconnect = useCallback(() => {
    clearSession();
    setPiAccessToken(null);
    setUserData(null);
    setAppId(null);
    setProducts(null);
    setConnectionStatus("idle");
    setAuthMessage("Connect your Pi Wallet to continue.");
  }, []);

  const value: PiAuthContextType = {
    isAuthenticated: connectionStatus === "connected",
    authMessage,
    connectionStatus,
    hasError: connectionStatus === "error",
    piAccessToken,
    userData,
    appId,
    products,
    connect,
    disconnect,
    reinitialize: connect,
  };

  return (
    <PiAuthContext.Provider value={value}>{children}</PiAuthContext.Provider>
  );
}

export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error("usePiAuth must be used within a PiAuthProvider");
  }
  return context;
}
