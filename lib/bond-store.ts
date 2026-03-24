import { BondIntent } from './types';
import { BONDS_APP_CONFIG } from './bonds-config';

/**
 * Bond Store - Client-side storage for bond intents with cross-tab synchronization
 * Uses localStorage for persistence during testing and review
 * Implements storage events for real-time sync across browser tabs
 * In production, this would connect to a database
 */

const STORAGE_KEY = 'bonds_intents_v1';
const STORAGE_EVENT_KEY = 'bonds_storage_event';

// Storage event listeners for cross-tab synchronization
type StorageListener = () => void;
const storageListeners: StorageListener[] = [];

// Initialize storage with demo data if empty
function initializeStorage(): void {
  if (typeof window === 'undefined') return;
  
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const demoData = [
      {
        id: "BOND-1737000000000-DEMO1ABC",
        referenceId: "BOND-1737000000000-DEMO1ABC",
        domain: BONDS_APP_CONFIG.identity.domain,
        bondType: "municipal",
        issuer: "City Infrastructure Authority",
        amount: "10,000,000",
        maturityDate: "2034-12-31",
        couponRate: "4.5",
        notes: "For city transportation infrastructure development",
        status: "approved",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        walletSignature: "0xdemo1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        username: "Demo User",
        manifestData: {
          appName: BONDS_APP_CONFIG.identity.name,
          domain: BONDS_APP_CONFIG.identity.domain,
          version: BONDS_APP_CONFIG.identity.version,
          environment: BONDS_APP_CONFIG.release.environment,
          releaseTag: BONDS_APP_CONFIG.release.tag,
        },
        runtimeLog: [
          `${new Date(Date.now() - 86400000).toISOString()} - Bond intent created`,
          `${new Date(Date.now() - 86400000 + 1000).toISOString()} - Form validation passed`,
          `${new Date(Date.now() - 86400000 + 2000).toISOString()} - Wallet signature requested`,
          `${new Date(Date.now() - 86400000 + 3000).toISOString()} - Signature confirmed`,
          `${new Date(Date.now() - 86400000 + 4000).toISOString()} - Intent recorded`,
        ],
      },
      {
        id: "BOND-1736913600000-DEMO2XYZ",
        referenceId: "BOND-1736913600000-DEMO2XYZ",
        domain: BONDS_APP_CONFIG.identity.domain,
        bondType: "corporate",
        issuer: "Tech Innovation Corp",
        amount: "5,000,000",
        maturityDate: "2029-06-30",
        couponRate: "5.2",
        notes: "Expansion capital for research and development",
        status: "pending",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        walletSignature: "0xdemo9876543210fedcba9876543210fedcba9876543210fedcba9876543210fe",
        username: "Demo User",
        manifestData: {
          appName: BONDS_APP_CONFIG.identity.name,
          domain: BONDS_APP_CONFIG.identity.domain,
          version: BONDS_APP_CONFIG.identity.version,
          environment: BONDS_APP_CONFIG.release.environment,
          releaseTag: BONDS_APP_CONFIG.release.tag,
        },
        runtimeLog: [
          `${new Date(Date.now() - 172800000).toISOString()} - Bond intent created`,
          `${new Date(Date.now() - 172800000 + 1000).toISOString()} - Form validation passed`,
          `${new Date(Date.now() - 172800000 + 2000).toISOString()} - Wallet signature requested`,
          `${new Date(Date.now() - 172800000 + 3000).toISOString()} - Signature confirmed`,
          `${new Date(Date.now() - 172800000 + 4000).toISOString()} - Pending governance review`,
        ],
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
  }
}

/**
 * Subscribe to storage changes for cross-tab synchronization
 */
export function subscribeToStorageChanges(listener: StorageListener) {
  if (typeof window === 'undefined') return () => {};

  storageListeners.push(listener);

  // Return unsubscribe function
  return () => {
    const index = storageListeners.indexOf(listener);
    if (index > -1) {
      storageListeners.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of storage changes (internal state sync)
 */
function notifyListeners() {
  storageListeners.forEach(listener => {
    try {
      listener();
    } catch {
      // Non-fatal — individual listener errors should not break sync
    }
  });
}

/**
 * Trigger storage event for cross-tab synchronization
 */
function triggerStorageEvent() {
  if (typeof window === 'undefined') return;
  
  // Trigger a custom storage event to notify other tabs
  const event = new StorageEvent('storage', {
    key: STORAGE_EVENT_KEY,
    newValue: Date.now().toString(),
    storageArea: localStorage,
  });
  window.dispatchEvent(event);
}

/**
 * Initialize cross-tab synchronization listener
 */
export function initializeStorageSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_EVENT_KEY || e.key === STORAGE_KEY) {
      notifyListeners();
    }
  });
}

export function createBondIntent(intent: BondIntent): BondIntent {
  if (typeof window === 'undefined') return intent;

  const intents = getAllBondIntents();
  intents.unshift(intent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(intents));

  notifyListeners();
  triggerStorageEvent();

  return intent;
}

export function getBondIntent(id: string): BondIntent | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const intents = getAllBondIntents();
  return intents.find(bond => bond.id === id || bond.referenceId === id);
}

export function getAllBondIntents(): BondIntent[] {
  if (typeof window === 'undefined') return [];
  
  initializeStorage();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function updateBondIntent(id: string, updates: Partial<BondIntent>): BondIntent | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const intents = getAllBondIntents();
  const index = intents.findIndex(bond => bond.id === id || bond.referenceId === id);
  
  if (index !== -1) {
    intents[index] = { ...intents[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(intents));

    notifyListeners();
    triggerStorageEvent();

    return intents[index];
  }
  
  return undefined;
}

export function getStatistics() {
  const intents = getAllBondIntents();
  return {
    total: intents.length,
    pending: intents.filter(i => i.status === 'pending').length,
    approved: intents.filter(i => i.status === 'approved').length,
    recorded: intents.filter(i => i.status === 'recorded').length,
  };
}
