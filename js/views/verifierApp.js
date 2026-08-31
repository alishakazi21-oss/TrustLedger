// View 7: Verifier App (Fast DID & QR Credential Verification for Banks/Employers)
window.VerifierAppView = {
  lookupInput: 'did:trust:0x892a4f91e920d3f44bb519e0',
  verificationResult: null, // null or result object
  isScanning: false,

  render: function(container) {
    container.innerHTML = `
      <div class="page-container verifier-portal-box">
        <!-- View Header -->
        <div class="view-header" style="text-align: center; justify-content: center; flex-direction: column; align-items: center;">
          <div class="hero-pill-badge" style="margin-bottom: 8px;">
            ${Icons.get('qrCode', 14)} Zero-Knowledge Verifier Portal
          </div>
          <h1>Instant Credential &amp; DID Verifier</h1>
          <p>Instantly check verifiable credentials, property deeds, and biometric claims on the TrustLedger network.</p>
        </div>

        <!-- QR Scanner & DID Input Box -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div>
              <div class="card-title">${Icons.get('search', 18)} Search Credential or Scan QR</div>
              <div class="card-description">Enter a W3C DID, transaction hash, or scan an identity card</div>
            </div>
            <span class="badge badge-verified">Sub-second Check</span>
          </div>

          <!-- Camera Scanner Viewfinder -->
          <div class="qr-scanner-mock">
            <div class="qr-target-frame">
              <div class="ocr-laser-line"></div>
              <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(16, 185, 129, 0.6);">
                ${Icons.get('qrCode', 64)}
              </div>
            </div>
          </div>

          <!-- Input Group -->
          <div class="form-group">
            <label class="form-label">Decentralized Identifier (DID) / Token URI</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-input mono" id="verifier-did-input" value="${this.lookupInput}" style="font-size: 12px; flex: 1;" />
              <button class="btn btn-primary" onclick="window.VerifierAppView.verifyDid()">
                ${Icons.get('search', 16)} Verify Claim
              </button>
            </div>
          </div>

          <!-- Quick Test Selectors -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; align-self: center;">Quick Tests:</span>
            <button class="btn btn-secondary btn-sm" onclick="window.VerifierAppView.setQuickTest('did:trust:0x892a4f91e920d3f44bb519e0')">
              Alexander Sterling (Valid)
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.VerifierAppView.setQuickTest('did:trust:0x44fa71bb092e01ff3941a80c')">
              Helena Vance (Valid)
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.VerifierAppView.setQuickTest('did:trust:0x0000revoked0000fraud9999')">
              Revoked Fraud Entity (Invalid)
            </button>
          </div>
        </div>

        <!-- Verification Result Display -->
        ${this.renderResultCard()}
      </div>
    `;
  },

  renderResultCard: function() {
    if (!this.verificationResult) return '';

    const res = this.verificationResult;
    return `
      <div class="card ${res.isValid ? 'card-highlight' : ''}" style="${!res.isValid ? 'border-color: rgba(239, 68, 68, 0.4); box-shadow: var(--shadow-red);' : ''}">
        <div class="card-header">
          <div class="card-title">
            ${res.isValid ? Icons.get('checkCircle', 20) : Icons.get('alertTriangle', 20)} Verification Diagnostic
          </div>
          <span class="badge ${res.isValid ? 'badge-verified' : 'badge-danger'}">
            ${res.isValid ? 'VALID CREDENTIAL ✓' : 'INVALID / REVOKED ✗'}
          </span>
        </div>

        <div style="padding: 14px; border-radius: var(--radius-md); background: ${res.isValid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; border: 1px solid ${res.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${res.subjectName}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${res.message}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; margin-bottom: 16px;">
          <div class="attr-box">
            <div class="attr-box-label">Issuing Authority</div>
            <div class="attr-box-value">${res.issuer}</div>
          </div>
          <div class="attr-box">
            <div class="attr-box-label">Verification Tier</div>
            <div class="attr-box-value" style="color: ${res.isValid ? 'var(--verified-emerald)' : 'var(--critical-red)'};">${res.tier}</div>
          </div>
          <div class="attr-box">
            <div class="attr-box-label">Revocation Status</div>
            <div class="attr-box-value">${res.revocationStatus}</div>
          </div>
          <div class="attr-box">
            <div class="attr-box-label">Cryptographic Cryptosuite</div>
            <div class="attr-box-value mono" style="font-size: 11px;">Ed25519Signature2020</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Anchored Genesis Proof</label>
          <div class="mono" style="font-size: 10px; padding: 8px; background: #020a13; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); color: var(--verified-emerald); word-break: break-all;">
            ${res.proofHash}
          </div>
        </div>

        <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="App.showToast('Full W3C JSON-LD credential payload downloaded.', 'success')">
          ${Icons.get('download', 14)} Export Cryptographic Proof Audit Certificate
        </button>
      </div>
    `;
  },

  setQuickTest: function(did) {
    this.lookupInput = did;
    const input = document.getElementById('verifier-did-input');
    if (input) input.value = did;
    this.verifyDid();
  },

  verifyDid: function() {
    const input = document.getElementById('verifier-did-input');
    const did = input ? input.value : this.lookupInput;

    App.showToast('Performing cryptographic ledger query...', 'info');

    if (did.includes('revoked') || did.includes('fraud')) {
      this.verificationResult = {
        isValid: false,
        subjectName: 'Blacklisted Fraudulent Entity (Flagged by Security Consensus)',
        issuer: 'TrustLedger Security Consensus Node #1',
        tier: 'Revoked / Blacklisted',
        revocationStatus: 'REVOKED (Block #7,880,102)',
        proofHash: '0x0000dead0000beef0000cafe0000000000000000000000000000000000000000',
        message: 'This DID has been cryptographically revoked due to invalid notary credentials and attempted title tampering.'
      };
    } else {
      this.verificationResult = {
        isValid: true,
        subjectName: 'Alexander Sterling (Accredited Property Investor)',
        issuer: 'HM Land Registry & Identity Authority (Tier 3)',
        tier: 'Tier 3 (Institutional Accredited)',
        revocationStatus: 'Active & In Good Standing',
        proofHash: '0x9fa8730911ef0b4c8912d00192e44f8812cba0998811e9f029381c810992384a',
        message: 'Identity and biometric credentials verified. Authorized for high-value title conveyance.'
      };
    }

    this.render(document.getElementById('view-container'));
  }
};
