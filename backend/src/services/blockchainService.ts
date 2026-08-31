import { ethers } from 'ethers';
import { config } from '../config';
import { UserOperation } from '@trustledger/shared';

// Minimal ABIs needed by the backend
const ENTRY_POINT_ABI = [
  'function handleOps(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] calldata ops, address payable beneficiary) external',
  'function getUserOpHash(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) calldata userOp) external view returns (bytes32)',
  'function balanceOf(address account) external view returns (uint256)',
  'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
];

const ACCOUNT_FACTORY_ABI = [
  'function getAddress(address owner, uint256 salt) external view returns (address)',
  'function createAccount(address owner, uint256 salt) external returns (address)',
];

const PAYMASTER_ABI = [
  'function isWhitelisted(address) external view returns (bool)',
  'function setWhitelist(address target, bool status) external',
  'function gasSponsoredPerUser(address) external view returns (uint256)',
  'function totalGasSponsored() external view returns (uint256)',
  'function totalOperationsSponsored() external view returns (uint256)',
  'function getDeposit() external view returns (uint256)',
];

const PROPERTY_REGISTRY_ABI = [
  'function registerProperty(string calldata propertyId, string calldata parcelId, bytes32 deedHash, address initialOwner) external',
  'function transferProperty(string calldata propertyId, address newOwner, bytes32 newDeedHash) external',
  'function updateDeedHash(string calldata propertyId, bytes32 newDeedHash) external',
  'function getProperty(string calldata propertyId) external view returns (tuple(string propertyId, string parcelId, bytes32 deedHash, address currentOwner, uint256 versionNumber, uint256 lastUpdated, bool isRegistered))',
];

const ESCROW_ABI = [
  'function createDeal(bytes32 dealId, string calldata propertyId, address buyer, address payable seller, uint256 amount, bytes32 targetDeedHash) external',
  'function depositFunds(bytes32 dealId) external payable',
  'function approveAndRelease(bytes32 dealId) external',
  'function refundBuyer(bytes32 dealId) external',
  'function deals(bytes32) external view returns (bytes32 dealId, string propertyId, address buyer, address seller, uint256 amount, bytes32 targetDeedHash, uint8 state, uint256 createdAt)',
];

const SMART_ACCOUNT_ABI = [
  'function execute(address dest, uint256 value, bytes calldata func) external returns (bytes memory)',
  'function owner() external view returns (address)',
];

let _provider: ethers.JsonRpcProvider | null = null;
let _relayer: ethers.Wallet | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
  }
  return _provider;
}

export function getRelayerWallet(): ethers.Wallet {
  if (!_relayer) {
    if (!config.blockchain.relayerPrivateKey) {
      throw new Error('RELAYER_PRIVATE_KEY not configured');
    }
    _relayer = new ethers.Wallet(config.blockchain.relayerPrivateKey, getProvider());
  }
  return _relayer;
}

export function getEntryPoint(): ethers.Contract {
  return new ethers.Contract(config.contracts.entryPoint, ENTRY_POINT_ABI, getRelayerWallet());
}

export function getAccountFactory(): ethers.Contract {
  return new ethers.Contract(config.contracts.accountFactory, ACCOUNT_FACTORY_ABI, getRelayerWallet());
}

export function getPaymaster(): ethers.Contract {
  return new ethers.Contract(config.contracts.paymaster, PAYMASTER_ABI, getRelayerWallet());
}

export function getPropertyRegistryContract(): ethers.Contract {
  return new ethers.Contract(config.contracts.propertyRegistry, PROPERTY_REGISTRY_ABI, getRelayerWallet());
}

export function getEscrowContract(): ethers.Contract {
  return new ethers.Contract(config.contracts.escrow, ESCROW_ABI, getRelayerWallet());
}

/**
 * Get the counterfactual SmartAccount address for a user (before deployment).
 */
export async function getSmartAccountAddress(ownerEOA: string, salt: bigint): Promise<string> {
  const factory = getAccountFactory();
  // Use getFunction to avoid TypeScript confusing ethers.Contract dynamic method
  // with the zero-arg ethers.getAddress utility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (factory as any).getAddress(ownerEOA, salt);
}

/**
 * Build initCode for first-time SmartAccount deployment (ERC-4337 initCode field).
 */
export function buildInitCode(ownerEOA: string, salt: bigint): string {
  const factory = getAccountFactory();
  const factoryInterface = new ethers.Interface(ACCOUNT_FACTORY_ABI);
  const callData = factoryInterface.encodeFunctionData('createAccount', [ownerEOA, salt]);
  return ethers.concat([config.contracts.accountFactory, callData]);
}

/**
 * Get the current ERC-4337 nonce for a SmartAccount from the EntryPoint.
 */
export async function getAccountNonce(smartAccountAddress: string): Promise<bigint> {
  const ep = getEntryPoint();
  return ep.getNonce(smartAccountAddress, 0);
}

/**
 * Submit a fully constructed UserOperation to the EntryPoint via the relayer wallet.
 * This is the core of the custom bundler: no P2P mempool, just relayer → EntryPoint.
 */
export async function submitUserOperation(userOp: UserOperation): Promise<{
  txHash: string;
  blockNumber: number;
}> {
  const ep = getEntryPoint();
  const relayer = getRelayerWallet();

  const tx = await ep.handleOps([userOp], relayer.address, {
    gasLimit: 2_000_000,
  });
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Check if the blockchain node is reachable.
 */
export async function isBlockchainAvailable(): Promise<boolean> {
  if (!config.contracts.entryPoint) return false;
  try {
    await getProvider().getBlockNumber();
    return true;
  } catch {
    return false;
  }
}
