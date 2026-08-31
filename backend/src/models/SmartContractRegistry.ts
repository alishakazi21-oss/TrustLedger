import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────────────────────────

export type ContractType = 'EntryPoint' | 'AccountFactory' | 'Paymaster' | 'PropertyRegistry' | 'Escrow' | 'SmartAccount';

export interface ISmartContractRegistry extends Document {
  _id: Types.ObjectId;
  contractType: ContractType;
  /** Checksummed EVM address */
  address: string;
  /** Network name or chain ID, e.g. "localhost", "sepolia", "polygon-amoy" */
  network: string;
  chainId: number;
  /**
   * Path or identifier for the ABI JSON.
   * e.g. "./contracts/artifacts/Escrow.json" or an IPFS CID.
   * Full ABI not embedded here to avoid bloat — load it at runtime.
   */
  abiRef: string;
  /** Git commit SHA or release tag that produced this deployment */
  deployedFromCommit: string | null;
  deployedAt: Date;
  deployedBy: string | null; // wallet address of deployer
  /** True if this is the active deployment for this contractType+network */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const SmartContractRegistrySchema = new Schema<ISmartContractRegistry>(
  {
    contractType: {
      type: String,
      enum: {
        values: [
          'EntryPoint',
          'AccountFactory',
          'Paymaster',
          'PropertyRegistry',
          'Escrow',
          'SmartAccount',
        ] as ContractType[],
        message: '{VALUE} is not a valid contractType',
      },
      required: [true, 'contractType is required'],
    },
    address: {
      type: String,
      required: [true, 'address is required'],
      trim: true,
    },
    network: {
      type: String,
      required: [true, 'network is required'],
      trim: true,
    },
    chainId: {
      type: Number,
      required: [true, 'chainId is required'],
    },
    abiRef: {
      type: String,
      required: [true, 'abiRef is required'],
      trim: true,
    },
    deployedFromCommit: { type: String, default: null },
    deployedAt: {
      type: Date,
      required: [true, 'deployedAt is required'],
      default: () => new Date(),
    },
    deployedBy: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * PRIMARY LOOKUP — "give me the active Escrow contract on Sepolia"
 * Partial index so the uniqueness only applies to active records,
 * allowing old (isActive=false) deployments to remain in history.
 */
SmartContractRegistrySchema.index(
  { contractType: 1, network: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'unique_active_contract_per_network',
  }
);

/** Quickly find all deployments of a specific contract address */
SmartContractRegistrySchema.index({ address: 1 });

/** Timeline view of all deployments sorted by date */
SmartContractRegistrySchema.index({ deployedAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const SmartContractRegistry = mongoose.model<ISmartContractRegistry>(
  'SmartContractRegistry',
  SmartContractRegistrySchema
);
