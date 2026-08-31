import { ethers } from 'ethers';
import crypto from 'crypto';
import { VerifiableCredential, DIDDocument } from '@trustledger/shared';

/**
 * Generate a deterministic did:key or did:ethr style DID from an EOA address.
 */
export function generateDID(eoa: string): string {
  return `did:ethr:0x${eoa.toLowerCase().replace(/^0x/, '')}`;
}

/**
 * Create a W3C-compliant JSON-LD Verifiable Credential for an on-boarded identity.
 */
export function issueVerifiableCredential(params: {
  did: string;
  fullName: string;
  nationalIdHash: string;
  kycTier: string;
  issuerDid: string;
}): VerifiableCredential {
  const now = new Date().toISOString();
  const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const credentialId = `urn:uuid:${crypto.randomUUID()}`;

  const vc: VerifiableCredential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://trustledger.network/credentials/v1',
    ],
    id: credentialId,
    type: ['VerifiableCredential', 'TrustLedgerKYCCredential'],
    issuer: {
      id: params.issuerDid,
      name: 'TrustLedger Identity Authority',
    },
    issuanceDate: now,
    expirationDate: expiry,
    credentialSubject: {
      id: params.did,
      fullName: params.fullName,
      nationalIdHash: params.nationalIdHash,
      kycTier: params.kycTier,
      isVerified: true,
    },
    proof: {
      type: 'EcdsaSecp256k1Signature2020',
      created: now,
      verificationMethod: `${params.issuerDid}#keys-1`,
      proofPurpose: 'assertionMethod',
      // In production: sign with issuer private key via EthereumEip712Signature2021
      signatureValue: crypto
        .createHash('sha256')
        .update(credentialId + params.did + now)
        .digest('hex'),
    },
  };

  return vc;
}

/**
 * Build the DID Document for a given DID.
 */
export function buildDIDDocument(did: string, eoa: string): DIDDocument {
  return {
    id: did,
    controller: did,
    verificationMethod: [
      {
        id: `${did}#keys-1`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: did,
        blockchainAccountId: `eip155:31337:${eoa}`,
      },
    ],
    authentication: [`${did}#keys-1`],
  };
}

/**
 * Derive a stable 256-bit hash from a national ID + user DOB for privacy-preserving storage.
 */
export function hashNationalId(nationalId: string, dob: string): string {
  return crypto
    .createHash('sha256')
    .update(`${nationalId}:${dob}:trustledger-salt`)
    .digest('hex');
}

/**
 * Get counterfactual SmartAccount address for a user from AccountFactory.
 * salt = uint256 derived from userId (first 10 hex chars of sha256(userId)).
 */
export function deriveSmartAccountSalt(userId: string): bigint {
  const hash = crypto.createHash('sha256').update(userId).digest('hex');
  return BigInt('0x' + hash.slice(0, 16));
}
