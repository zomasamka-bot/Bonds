export interface PaymentRecord {
  /** Pi Network payment identifier */
  paymentId: string;
  /** On-chain transaction ID (set after completion) */
  txid?: string;
  /** Amount in Pi */
  amount: number;
  /** Payment lifecycle status */
  paymentStatus: 'initiated' | 'approved' | 'completed' | 'cancelled' | 'error';
  /** ISO timestamp of payment initiation */
  initiatedAt: string;
  /** ISO timestamp of payment completion */
  completedAt?: string;
  /** Issuer wallet address this payment was directed to */
  issuerWalletAddress?: string;
}

export interface BondIntent {
  id: string;
  referenceId: string;
  domain: string;
  bondType: string;
  /** Human-readable issuing entity name */
  issuer: string;
  /** Raw Pi wallet address of the issuer — used as payment recipient */
  issuerWalletAddress?: string;
  amount: string;
  /** Parsed numeric bond amount in Pi */
  bondAmountPi?: number;
  maturityDate: string;
  couponRate: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'recorded';
  timestamp: string;
  walletSignature?: string;
  username?: string;
  /**
   * Bond principal payment record.
   * Investor → issuer wallet, executed via Pi SDK + backend proxy.
   * Payment ID, TXID, and status are all confirmed on-chain.
   */
  payment?: PaymentRecord;
  manifestData: {
    appName: string;
    domain: string;
    version: string;
    environment: string;
    releaseTag?: string;
  };
  runtimeLog: string[];
}

export interface BondFormData {
  bondType: string;
  issuer: string;
  issuerWalletAddress: string;
  amount: string;
  maturityDate: string;
  couponRate: string;
  notes: string;
}
