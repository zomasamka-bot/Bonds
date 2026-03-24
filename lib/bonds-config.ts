/**
 * Unified Core Engine Configuration for Bonds Application
 * Defines app behavior, identity, and operational parameters
 */

export const BONDS_APP_CONFIG = {
  // App Identity
  identity: {
    name: "Bonds",
    domain: "bonds.pi",
    version: "1.0.0",
    tagline: "Institutional Records System",
    description: "Institutional records to document and track bond issuance or allocation intents within governance frameworks",
    category: "Institutional Finance",
  },

  // Release Information
  release: {
    tag: "v1.0.0-testnet",
    buildDate: new Date().toISOString(),
    environment: "Pi Network Testnet",
  },

  // Payment Configuration
  payment: {
    /** When true the Pi SDK is initialized with sandbox: true */
    testnet: true,
    /** Generate the payment memo for the bond principal transfer */
    memo: (referenceId: string, bondAmountPi: number) =>
      `Bond principal [Testnet] — ${bondAmountPi} Pi — ${referenceId}`,
  },

  // Bond Types Configuration
  bondTypes: [
    { value: "municipal", label: "Municipal Bond", description: "Issued by local government entities" },
    { value: "corporate", label: "Corporate Bond", description: "Issued by corporations" },
    { value: "treasury", label: "Treasury Bond", description: "Government-backed securities" },
    { value: "infrastructure", label: "Infrastructure Bond", description: "For infrastructure projects" },
    { value: "green", label: "Green Bond", description: "For environmental projects" },
    { value: "social", label: "Social Bond", description: "For social impact projects" },
  ],

  // Workflow Configuration
  workflow: {
    steps: ["Open", "Create", "Sign", "Record", "Status"],
    requiresSignature: true,
    allowsEditing: false,
  },

  // Validation Rules
  validation: {
    minAmount: 10,
    maxAmount: 1000000000,
    minCouponRate: 0,
    maxCouponRate: 20,
    requiredFields: ["bondType", "issuer", "issuerWalletAddress", "amount", "maturityDate", "couponRate"],
  },

  // Status Types
  statusTypes: {
    pending: { label: "Pending", color: "secondary", description: "Awaiting review" },
    approved: { label: "Approved", color: "default", description: "Intent approved" },
    rejected: { label: "Rejected", color: "destructive", description: "Intent rejected" },
    recorded: { label: "Recorded", color: "default", description: "Successfully recorded" },
  },

  // Evidence Pack Configuration
  evidencePack: {
    includeReferenceId: true,
    includeTimestamp: true,
    includeWalletSignature: true,
    includeRuntimeLog: true,
    includeManifest: true,
    includeReleaseTag: true,
  },
} as const;

export type BondType = typeof BONDS_APP_CONFIG.bondTypes[number]["value"];
export type BondStatus = keyof typeof BONDS_APP_CONFIG.statusTypes;
