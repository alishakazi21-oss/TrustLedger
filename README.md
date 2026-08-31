# TrustLedger

> **Verify the Person. Verify the Property. Secure the Transaction.**

A blockchain-based digital trust & property transaction platform built for a hackathon MVP.  
It verifies identity, verifies legal documents, and executes secure real-estate transactions on-chain — all as one connected workflow.

```
Identity → Documents → Property → Transaction
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| API Server | Node.js + Express + TypeScript |
| Database | MongoDB (Mongoose) |
| Smart Contracts | Solidity + Hardhat |
| Chain Connectivity | ethers.js v6 |
| Gas Sponsorship | Custom ERC-4337 (SmartAccount + Paymaster + AccountFactory) |
| EntryPoint | `@account-abstraction/contracts` (eth-infinitism audited singleton) |
| OCR | tesseract.js |
| Auth | JWT with RBAC (individual, issuer, verifier, registrar, admin) |

---

## Project Structure

```
TrustLedger/
├── backend/          # Express REST API
│   ├── src/
│   │   ├── config/       # DB connection, env config
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, error handling
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express routers
│   │   ├── services/     # Business logic (blockchain, identity, OCR, URL scan)
│   │   └── scripts/      # seed.ts
│   ├── openapi.yaml      # Full OpenAPI 3.0 spec
│   └── .env.example
│
├── contracts/        # Hardhat project
│   ├── contracts/
│   │   ├── core/
│   │   │   ├── SmartAccount.sol       # ERC-4337 smart wallet (per-user)
│   │   │   ├── AccountFactory.sol     # CREATE2 factory
│   │   │   └── TrustLedgerPaymaster.sol # Gas-sponsoring paymaster
│   │   └── realestate/
│   │       ├── PropertyRegistry.sol   # On-chain property cadastre
│   │       └── Escrow.sol             # Locked funds + title transfer
│   ├── scripts/deploy.ts
│   └── test/AccountAbstraction.test.ts
│
└── shared/           # Shared TypeScript types
    └── src/index.ts
```

---

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally (default: `mongodb://localhost:27017/trustledger`)
- **npm** ≥ 9

> **Quick MongoDB setup with Docker:**
> ```bash
> docker run -d --name mongo-trustledger -p 27017:27017 mongo:7
> ```

---

## Quick Start

### 1. Clone & install all dependencies

```bash
cd TrustLedger

# Install shared types
cd shared && npm install && npm run build && cd ..

# Install contracts dependencies
cd contracts && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set MONGO_URI and JWT_SECRET
```

### 3. Compile & deploy smart contracts (local Hardhat node)

Open a **new terminal** and start the local chain:
```bash
cd contracts
npx hardhat node
```

In another terminal, deploy all contracts:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the printed contract addresses into `backend/.env`:
```
CONTRACT_ENTRY_POINT=0x...
CONTRACT_ACCOUNT_FACTORY=0x...
CONTRACT_PAYMASTER=0x...
CONTRACT_PROPERTY_REGISTRY=0x...
CONTRACT_ESCROW=0x...
```

### 4. Seed the database

```bash
cd backend
npm run seed
```

This creates 6 demo users, 3 properties (Low/Medium/High risk), 2 documents, and 1 live transaction. All passwords: **`Demo@1234`**

### 5. Start the API server

```bash
cd backend
npm run dev
```

API available at: **http://localhost:4000**  
Health check: **GET http://localhost:4000/health**

---

## API Overview

| Module | Endpoints | Description |
|---|---|---|
| Auth | `POST /auth/register` `POST /auth/login` `GET /auth/me` | JWT authentication |
| Identity | `POST /identity/onboard` `GET /identity/:did` | DID + Verifiable Credential |
| Documents | `POST /documents/upload` `GET /documents/:id` `POST /documents/:id/revoke` | OCR + hash + registry + URL scan |
| Properties | `GET /properties` `POST /properties` `GET /properties/:id/history` `POST /properties/:id/amend` | Immutable versioned cadastre |
| Transactions | `POST /transactions` `POST /transactions/:id/fund` `POST /transactions/:id/approve` `POST /transactions/:id/cancel` | Escrow lifecycle |
| Bundler | `POST /bundler/submit` `GET /bundler/status` | Custom ERC-4337 relayer |
| Admin | `GET /admin/stats` `GET /admin/audit-logs` `GET /admin/users` | Platform monitoring |

Full OpenAPI 3.0 spec: [`backend/openapi.yaml`](./backend/openapi.yaml)

---

## ERC-4337 Account Abstraction Flow

```
User (no ETH needed)
    │
    ▼ signs UserOperation
Backend (Transaction Orchestration)
    │ constructs UserOp with paymasterAndData = Paymaster address
    ▼
POST /bundler/submit
    │
    ▼ EntryPoint.handleOps([userOp], relayerWallet)
EntryPoint (eth-infinitism singleton)
    │ calls validatePaymasterUserOp()
    ▼
TrustLedgerPaymaster.sol
    │ checks sender is whitelisted TrustLedger user
    │ charges gas from EntryPoint deposit (not user)
    │ postOp() records sponsorship analytics
    ▼
SmartAccount.sol (per-user wallet)
    │ validateUserOp() verifies ECDSA owner signature
    │ execute() calls Escrow.approveAndRelease() or PropertyRegistry.transferProperty()
    ▼
PropertyRegistry / Escrow contracts
```

**The user's own ETH balance never moves.** The relayer wallet pays gas; the Paymaster reimburses it from its EntryPoint deposit.

---

## Running Contract Tests

```bash
cd contracts
npx hardhat test
```

Tests prove:
1. ✅ UserOperation from a fresh SmartAccount executes successfully
2. ✅ User EOA balance unchanged before/after
3. ✅ Paymaster's EntryPoint deposit decreases instead

---

## Demo Users (after seed)

| Email | Role | Password |
|---|---|---|
| admin@trustledger.network | admin | Demo@1234 |
| buyer@trustledger.network | individual | Demo@1234 |
| seller@trustledger.network | individual | Demo@1234 |
| registrar@trustledger.network | registrar | Demo@1234 |
| issuer@trustledger.network | issuer | Demo@1234 |
| verifier@trustledger.network | verifier | Demo@1234 |

---

## Document Verification Pipeline

1. **SHA-256 Hash** — tamper-evident fingerprint of every uploaded file
2. **OCR** (tesseract.js) — extracts text from images and PDFs
3. **Registry Cross-Check** — matches extracted parcel IDs against seeded government records
4. **Zero-Trust URL Scanner** — extracts all URLs from OCR text, checks for:
   - Non-HTTPS protocols
   - Domains on security denylist
   - Lookalike/typosquatted land registry domains
   - Suspicious IP-address URLs
   - Excessive subdomain depth (domain spoofing)

---

## Property Versioning Model

Properties are **never overwritten**. Each correction creates a new immutable version:

```
Version 1 (Original)  ──→  Version 2 (Corrected)  ──→  Version 3 (Corrected)
  status: Superseded          status: Superseded          status: Corrected
  previousVersionId: null     previousVersionId: v1._id   previousVersionId: v2._id
```

`GET /properties/:id/history` returns the complete chain for audit/litigation purposes.

---

## MongoDB Schema & Collections

```
TrustLedger MongoDB Schema Graph
─────────────────────────────────────────────────────────────────────────────
[User] (role, did, kycStatus)
  ├── 1:N ──> [Credential] (did, credentialType, status, credentialHash)
  ├── 1:N ──> [Document] (docType, originalHash [UNIQUE], verificationStatus)
  │             └── 1:N ──> [URLScanResult] (url, isSafe, riskScore, hostname)
  ├── 1:N ──> [Property] (registryNumber [UNIQUE], litigationRiskScore)
  │             ├── 1:N ──> [PropertyVersion] (versionNumber, status, previousVersionId)
  │             └── 1:N ──> [Transaction] (buyerId, sellerId, amount, status)
  └── 1:N ──> [AuditLog] (actorId, action, entityType, entityId, timestamp)

[SmartContractRegistry] (contractType, address, network, abiRef, isActive)
─────────────────────────────────────────────────────────────────────────────
```

### Collection Overview

1. **`users`**: User profiles with roles (`individual`, `issuer`, `verifier`, `registrar`, `admin`), DID, KYC status, and counterfactual smart account address.
2. **`credentials`**: Issued W3C Verifiable Credentials linked to user DIDs with compound index `{ did: 1, status: 1 }`.
3. **`documents`**: Tamper-evident uploaded legal documents with unique `originalHash` (SHA-256) constraint and OCR text extraction.
4. **`urlScanResults`**: Heuristic security analysis of all URLs discovered in documents (detecting non-HTTPS, typosquatting, and lookalike registry domains).
5. **`properties`**: Canonical property cadastre records with unique `registryNumber`, 2dsphere boundary geo-indexing, and litigation risk scores.
6. **`propertyVersions`**: Append-only amendment history linked via `previousVersionId` and indexed on `{ propertyId: 1, versionNumber: 1 }`.
7. **`transactions`**: Escrow transaction states (`Offered` &rarr; `EscrowFunded` &rarr; `Verifying` &rarr; `ContractExecuted` &rarr; `TitleTransferred`) with multi-party approval tracking.
8. **`auditLogs`**: Append-only immutable system and user activity trail indexed on `{ entityType: 1, entityId: 1, timestamp: -1 }`.
9. **`smartContractRegistry`**: On-chain deployments with partial unique indexes on `{ contractType: 1, network: 1, isActive: true }`.

---

## Connecting the Frontend

The frontend (served on `http://localhost:3000`) is pre-configured in the CORS allowlist. No extra configuration needed.

