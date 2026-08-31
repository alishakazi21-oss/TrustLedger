// Global Application Store for TrustLedger with Live Backend Synchronization
window.AppState = {
  isBackendConnected: false,
  backendInfo: null,

  // Active Persona / Role: 'buyer', 'seller', 'verifier', 'registrar', 'admin'
  currentPersona: 'buyer',

  personas: {
    buyer: {
      id: 'usr_buyer_901',
      name: 'Alexander Sterling',
      email: 'buyer@trustledger.network',
      roleTitle: 'Verified Buyer',
      avatarText: 'AS',
      did: 'did:ethr:0x892a4f91e920d3f44bb519e0',
      isKycVerified: true,
      kycTier: 'Tier 3 (Institutional)',
      nationalIdHash: '0x9924c...b981f',
      walletSponsored: true,
      reputationScore: 99.4
    },
    seller: {
      id: 'usr_seller_402',
      name: 'Helena Vance-Croft',
      email: 'seller@trustledger.network',
      roleTitle: 'Property Owner / Seller',
      avatarText: 'HV',
      did: 'did:ethr:0x44fa71bb092e01ff3941a80c',
      isKycVerified: true,
      kycTier: 'Tier 3 (Institutional)',
      nationalIdHash: '0x712fa...e4401',
      walletSponsored: true,
      reputationScore: 98.8
    },
    verifier: {
      id: 'usr_verif_108',
      name: 'Apex Mortgage Verifier',
      email: 'verifier@trustledger.network',
      roleTitle: 'Institutional Verifier / Escrow Officer',
      avatarText: 'AM',
      did: 'did:ethr:0x11bb9420ae456f901188bb34',
      isKycVerified: true,
      kycTier: 'Regulated Financial Entity',
      nationalIdHash: '0x3344a...b001a',
      walletSponsored: true,
      reputationScore: 100.0
    },
    registrar: {
      id: 'usr_reg_005',
      name: 'Patricia Okoye (City Registrar)',
      email: 'registrar@trustledger.network',
      roleTitle: 'Government Property Registrar',
      avatarText: 'PO',
      did: 'did:ethr:0x0001gov9942aef912093e441',
      isKycVerified: true,
      kycTier: 'Government Official Signatory',
      nationalIdHash: '0x00119...99a00',
      walletSponsored: true,
      reputationScore: 100.0
    },
    admin: {
      id: 'usr_admin_999',
      name: 'System Admin',
      email: 'admin@trustledger.network',
      roleTitle: 'Consensus & Security Admin',
      avatarText: 'SA',
      did: 'did:ethr:0x9999admin0001000200030004',
      isKycVerified: true,
      kycTier: 'Protocol Root Authority',
      nationalIdHash: '0xroot0...consensus',
      walletSponsored: true,
      reputationScore: 100.0
    }
  },

  // Properties list
  properties: [
    {
      id: 'PROP-DEMO-001',
      title: '14 Birchwood Crescent Heritage Estate',
      address: '14 Birchwood Crescent, London, SW3 4QR',
      parcelId: 'GLR-GB-9821',
      zoning: 'Residential Grade II Historical',
      sqFt: '2,400 sq ft',
      estimatedValue: '$3,850,000 USD',
      currentOwner: 'Helena Vance-Croft',
      ownerDid: 'did:ethr:0x44fa71bb092e01ff3941a80c',
      riskStatus: 'Low',
      riskScore: '99/100 Clean Title',
      riskDetails: 'Zero outstanding mortgages, 0 municipal encumbrances, full topological boundary match.',
      cadastralCoordinates: '51.5074° N, 0.1278° W',
      currentDeedHash: '0x9fa8730911ef0b4c8912d00192e44f8812cba0998811e9f029381c810992384a',
      history: [
        {
          version: 'v1.0 (Original Deed)',
          date: '14 Oct 2018',
          type: 'SUPERSEDED',
          event: 'Initial Crown Cadastral Digitization & Genesis Mint',
          parties: 'HM Land Registry → Sterling Trust Holding',
          blockNumber: '#1,048,291',
          blockHash: '0x181048...f9021',
          isSuperseded: true
        },
        {
          version: 'v2.0 (Superseded Transfer)',
          date: '22 Feb 2021',
          type: 'SUPERSEDED',
          event: 'Secured Sale & Title Conveyance',
          parties: 'Sterling Trust Holding → Helena Vance-Croft',
          blockNumber: '#3,491,012',
          blockHash: '0x349101...b882a',
          isSuperseded: true
        },
        {
          version: 'v2.1 (Current Active Deed)',
          date: '18 Jan 2026',
          type: 'CURRENT',
          event: 'Cadastral GIS Perimeter Correction & Solar Easement Recording',
          parties: 'Approved by Municipal Registrar (Patricia Okoye)',
          blockNumber: '#7,882,904',
          blockHash: '0x9fa873...92384a',
          isSuperseded: false
        }
      ]
    }
  ],

  // Active Transactions / Escrow
  activeTransaction: {
    txId: 'TX-ESCROW-2026-8819',
    propertyId: 'PROP-DEMO-001',
    propertyTitle: '14 Birchwood Crescent Heritage Estate',
    priceUsd: '$485,000',
    escrowDepositUsd: '$509,250 (105% Escrow Reserve)',
    buyerName: 'Alexander Sterling',
    buyerDid: 'did:ethr:0x892a4f91e920d3f44bb519e0',
    sellerName: 'Helena Vance-Croft',
    sellerDid: 'did:ethr:0x44fa71bb092e01ff3941a80c',
    escrowAgent: 'Barclays Escrow Trust Node #4',
    gasFeeStatus: 'Sponsored by TrustLedger Relayer (0.00 USD cost to user)',
    sha256Proof: '0x49e0b9821afbc991048a88192039485761928374615243546574839201928374',
    currentStep: 2, // 1: Offer Made, 2: Escrow Funded, 3: Verification, 4: Smart Contract, 5: Title Transferred
    steps: [
      { id: 1, name: 'Offer Made', status: 'completed', timestamp: '28 Aug 2026 10:14 UTC', detail: 'Binding digital deed purchase offer signed by Alexander Sterling.' },
      { id: 2, name: 'Escrow Funded', status: 'completed', timestamp: '29 Aug 2026 14:30 UTC', detail: '$509,250 locked into TrustLedger multi-sig escrow vault.' },
      { id: 3, name: 'Legal Verification', status: 'in-progress', timestamp: '30 Aug 2026 09:00 UTC', detail: 'Automated municipal deed registry OCR cross-check & survey clearance.' },
      { id: 4, name: 'Smart Contract Executed', status: 'pending', timestamp: 'Estimated in 2 hours', detail: 'Simultaneous funds release & cryptographic title signature swap.' },
      { id: 5, name: 'Title Transferred', status: 'pending', timestamp: 'Pending Step 4', detail: 'Immutable record minted on Crown Cadastral Subnet.' }
    ],
    buyerApproved: true,
    sellerApproved: false,
    registrarApproved: false
  },

  // Registrar Pending Approvals Queue
  registrarQueue: [
    {
      id: 'REQ-REG-771',
      type: 'Boundary Amendment',
      propertyId: 'PROP-DEMO-001',
      title: '14 Birchwood Crescent - Boundary Solar Offset Amendment',
      submittedBy: 'Cadastral Land Surveyor #19',
      submittedAt: 'Today, 08:30 UTC',
      status: 'Awaiting Approval',
      riskScore: 'Low Risk (0.02% coordinate adjustment)',
      priorHash: '0x349101...b882a',
      proposedHash: '0x9fa873...92384a',
      changes: 'Updated coordinate pin 4B from 51.49882 to 51.49884 to conform with municipal parkway line.'
    }
  ],

  // Recent Audit Trail Events
  auditTrail: [
    {
      txHash: '0x9f1a...b891',
      action: 'Biometric e-KYC Verification Passed',
      actor: 'Alexander Sterling',
      target: 'DID: did:ethr:0x892a...',
      timestamp: '12 mins ago',
      block: '#7,882,910',
      status: 'VERIFIED'
    },
    {
      txHash: '0x44d2...001e',
      action: 'Escrow Multi-Sig Deposit Confirmed',
      actor: 'Barclays Escrow Node',
      target: '$509,250.00 USD (TX-8819)',
      timestamp: '1 hour ago',
      block: '#7,882,905',
      status: 'VERIFIED'
    }
  ],

  // Admin Telemetry & Statistics
  adminStats: {
    verificationsProcessed: 14892,
    propertiesRegistered: 3410,
    transactionsCompletedVolume: '$48.2M',
    fraudAttemptsBlocked: 187,
    networkNodes: 18,
    activeConsensus: 'PBFT-SHA256 (Sub-second finality)',
    gasRelayerBalance: '$24,500 USD (Subsidizing user gas)'
  },

  // ─── Persona Management ───────────────────────────────────────────────────
  getCurrentUser: function() {
    return this.personas[this.currentPersona];
  },

  setPersona: async function(personaKey) {
    if (this.personas[personaKey]) {
      this.currentPersona = personaKey;
      const user = this.getCurrentUser();
      
      // Auto-authenticate with live backend
      if (this.isBackendConnected) {
        try {
          await TrustLedgerAPI.login(user.email, 'Demo@1234');
        } catch (_e) {}
      }

      window.dispatchEvent(new CustomEvent('persona-changed', { detail: user }));
    }
  },

  // ─── Live Backend Health & Sync ───────────────────────────────────────────
  checkBackendHealth: async function(showToastNotice = false) {
    const apiPill = document.getElementById('topbar-api-pill');
    const textEl = document.getElementById('api-status-text');

    try {
      const data = await TrustLedgerAPI.checkHealth();
      this.isBackendConnected = true;
      this.backendInfo = data;

      if (textEl) textEl.textContent = 'Backend: Online (Port 4000)';
      if (apiPill) {
        apiPill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        const dot = apiPill.querySelector('.pulse-dot');
        if (dot) dot.style.background = 'var(--verified-emerald)';
      }

      // Auto-login active persona
      const user = this.getCurrentUser();
      try {
        await TrustLedgerAPI.login(user.email, 'Demo@1234');
      } catch (_e) {}

      // Synchronize live data
      await this.syncLiveProperties();
      await this.syncLiveAuditLogs();

      if (showToastNotice && window.App) {
        window.App.showToast('Connected to TrustLedger Live Node (Port 4000)', 'success');
      }
    } catch (err) {
      this.isBackendConnected = false;
      if (textEl) textEl.textContent = 'Backend: Offline (Mock Mode)';
      if (apiPill) {
        apiPill.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        const dot = apiPill.querySelector('.pulse-dot');
        if (dot) dot.style.background = 'var(--accent-crimson)';
      }
      if (showToastNotice && window.App) {
        window.App.showToast('Backend offline. Using in-browser state engine.', 'info');
      }
    }
  },

  async syncLiveProperties() {
    try {
      const data = await TrustLedgerAPI.listProperties();
      if (data && data.properties && data.properties.length > 0) {
        this.properties = data.properties.map(p => ({
          id: p._id || p.registryNumber,
          title: p.currentVersionId?.snapshotData?.title || `Property ${p.registryNumber}`,
          address: p.currentVersionId?.snapshotData?.address || 'Official Registry Address',
          parcelId: p.registryNumber,
          zoning: p.currentVersionId?.snapshotData?.zoning || 'Residential',
          sqFt: p.currentVersionId?.snapshotData?.sqFt || '2,400 sq ft',
          estimatedValue: '$3,850,000 USD',
          currentOwner: p.currentOwnerId?.name || 'Helena Vance-Croft',
          ownerDid: p.currentOwnerId?.did || 'did:ethr:0x44fa71bb...',
          riskStatus: p.litigationRiskScore || 'Low',
          riskScore: p.litigationRiskScore === 'Low' ? '99/100 Clean Title' : '65/100 Review Advised',
          riskDetails: p.encumbrances?.length ? p.encumbrances.join('; ') : 'Zero outstanding encumbrances.',
          currentDeedHash: p.currentVersionId?.snapshotData?.deedHash || '0x9fa873...92384a',
          history: []
        }));
      }
    } catch (_e) {}
  },

  async syncLiveAuditLogs() {
    try {
      const data = await TrustLedgerAPI.getAuditLogs({ limit: 10 });
      if (data && data.logs && data.logs.length > 0) {
        this.auditTrail = data.logs.map(l => ({
          txHash: l.onChainTxHash ? l.onChainTxHash.substring(0, 10) + '...' : '0x' + Math.random().toString(16).substring(2, 10),
          action: l.action.replace(/_/g, ' '),
          actor: l.actorId?.name || l.actorEmail || l.actorRole,
          target: l.entityType,
          timestamp: new Date(l.timestamp).toLocaleTimeString(),
          block: '#' + (Math.floor(Math.random() * 1000) + 7882000),
          status: 'VERIFIED'
        }));
      }
    } catch (_e) {}
  }
};

// Periodic background health check
setTimeout(() => {
  if (window.AppState) window.AppState.checkBackendHealth();
}, 500);
setInterval(() => {
  if (window.AppState) window.AppState.checkBackendHealth();
}, 15000);
