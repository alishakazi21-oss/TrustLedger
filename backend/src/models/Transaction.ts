import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────────────────────────

export type TransactionStatus =
  | 'Offered'
  | 'EscrowFunded'
  | 'Verifying'
  | 'ContractExecuted'
  | 'TitleTransferred'
  | 'Cancelled'
  | 'Refunded';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  /** Human-readable ID for the frontend, e.g. "TX-ESCROW-2026-8819" */
  txId: string;
  propertyId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  status: TransactionStatus;
  /** Agreed sale price in USD (or local currency) */
  amount: number;
  /** Escrowed amount (typically price + buffer) */
  escrowAmount: number;
  /** On-chain address of the deployed Escrow.sol instance for this deal */
  escrowContractAddress: string | null;
  /**
   * bytes32 deal ID used as the on-chain key inside Escrow.sol.
   * Hex string, keccak256(txId + propertyId + timestamp).
   */
  onChainDealId: string | null;
  /** ERC-4337 UserOperation hash if the final step was gas-sponsored */
  userOpHash: string | null;
  /** TX hash of the on-chain settlement (release or refund) */
  onChainTxHash: string | null;
  onChainBlockNumber: number | null;
  // ── Approval gates ──────────────────────────────────────────────────────────
  buyerApproved: boolean;
  sellerApproved: boolean;
  registrarApproved: boolean;
  /** Populated when status = Cancelled or Refunded */
  rejectionReason: string | null;
  /** When the transaction reached a terminal state */
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const TransactionSchema = new Schema<ITransaction>(
  {
    txId: {
      type: String,
      required: [true, 'txId is required'],
      trim: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'propertyId is required'],
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'buyerId is required'],
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'sellerId is required'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'Offered',
          'EscrowFunded',
          'Verifying',
          'ContractExecuted',
          'TitleTransferred',
          'Cancelled',
          'Refunded',
        ] as TransactionStatus[],
        message: '{VALUE} is not a valid transaction status',
      },
      default: 'Offered',
    },
    amount: {
      type: Number,
      required: [true, 'amount is required'],
      min: [0, 'amount must be ≥ 0'],
    },
    escrowAmount: {
      type: Number,
      required: [true, 'escrowAmount is required'],
      min: [0, 'escrowAmount must be ≥ 0'],
    },
    escrowContractAddress: { type: String, default: null },
    onChainDealId: { type: String, default: null },
    userOpHash: { type: String, default: null },
    onChainTxHash: { type: String, default: null },
    onChainBlockNumber: { type: Number, default: null },
    buyerApproved: { type: Boolean, default: false },
    sellerApproved: { type: Boolean, default: false },
    registrarApproved: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/** Globally unique human-readable ID */
TransactionSchema.index({ txId: 1 }, { unique: true });

/** Dashboard views for buyer and seller */
TransactionSchema.index({ buyerId: 1, status: 1 });
TransactionSchema.index({ sellerId: 1, status: 1 });

/** Property's full transaction history */
TransactionSchema.index({ propertyId: 1, createdAt: -1 });

/** Admin queue: transactions stuck in non-terminal states */
TransactionSchema.index({
  status: 1,
  createdAt: -1,
});

// ─── Model ────────────────────────────────────────────────────────────────────

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
