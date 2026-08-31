// View 4: Document Verification & Zero-Trust OCR Analyzer
window.DocVerificationView = {
  isVerifying: false,
  activeSample: 'authentic', // 'authentic' or 'tampered'
  verificationStage: 0, // 0: Idle, 1: Uploading, 2: OCR Extracting, 3: SHA-256 Hashing, 4: Registry Cross-Checking, 5: Result Ready
  docData: {
    authentic: {
      fileName: 'Kensington_Deed_Registry_GLR-GB-9821.pdf',
      fileSize: '3.8 MB',
      sha256Hash: '0x9fa8730911ef0b4c8912d00192e44f8812cba0998811e9f029381c810992384a',
      notarySigner: 'Hon. Eleanor Vance (Gov Registrar #401)',
      parcelId: 'GLR-GB-9821-KENS-401',
      status: 'VERIFIED_AUTHENTIC',
      matchScore: '100.0% Match',
      linksFound: [
        { url: 'https://land-registry.gov.uk/cadastre/9821', status: 'SAFE', reputation: 'Gov Verified' },
        { url: 'https://trustledger.network/proof/0x9fa873', status: 'SAFE', reputation: 'Ledger Sealed' }
      ],
      clauses: [
        { label: 'Grantor / Seller', value: 'Helena Vance-Croft (did:trust:0x44fa71...)', status: 'MATCH' },
        { label: 'Parcel Boundary GIS', value: '51.4988° N, 0.1983° W (Perimeter 320m)', status: 'MATCH' },
        { label: 'Encumbrances / Liens', value: 'None Recorded (Zero outstanding mortgages)', status: 'MATCH' },
        { label: 'Notary Cryptographic Seal', value: 'HM Land Registry ECDSA Secp256k1 Seal', status: 'MATCH' }
      ]
    },
    tampered: {
      fileName: 'Modified_Deed_Transfer_Forged_GLR-GB-9821.pdf',
      fileSize: '3.9 MB',
      sha256Hash: '0x3310fa8829910baef91982039182390182391029381029384758192039485711',
      notarySigner: 'Unknown / Unrecognized Private Key',
      parcelId: 'GLR-GB-9821-KENS-401',
      status: 'TAMPERING_DETECTED',
      matchScore: '38.4% Discrepancy (Hash Mismatch)',
      linksFound: [
        { url: 'http://fake-registry-clone.xyz/intercept', status: 'UNSAFE', reputation: 'Phishing Threat Flagged' }
      ],
      clauses: [
        { label: 'Grantor / Seller', value: 'Helena Vance-Croft (Forged Signature)', status: 'MISMATCH' },
        { label: 'Parcel Boundary GIS', value: 'Boundary expanded by +450 sq ft without municipal permit', status: 'MISMATCH' },
        { label: 'Encumbrances / Liens', value: 'Hidden Private Second Lien Found in Registry', status: 'MISMATCH' },
        { label: 'Notary Seal Signature', value: 'Invalid Cryptographic Checksum', status: 'MISMATCH' }
      ]
    }
  },

  render: function(container) {
    const data = this.docData[this.activeSample];
    const isReady = this.verificationStage === 5;

    container.innerHTML = `
      <div class="page-container">
        <!-- View Header -->
        <div class="view-header">
          <div class="view-title-group">
            <h1>Cryptographic Document Verification &amp; OCR Engine</h1>
            <p>Cross-examine property deeds, titles, and legal covenants against the immutable Cadastral Ledger.</p>
          </div>
          
          <!-- Sample Toggle Buttons for Demonstration -->
          <div class="view-actions">
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Test Samples:</span>
            <button class="btn ${this.activeSample === 'authentic' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="window.DocVerificationView.selectSample('authentic')">
              ${Icons.get('checkCircle', 14)} Authentic Deed Sample
            </button>
            <button class="btn ${this.activeSample === 'tampered' ? 'btn-danger' : 'btn-secondary'} btn-sm" onclick="window.DocVerificationView.selectSample('tampered')">
              ${Icons.get('alertTriangle', 14)} Tampered Deed Sample
            </button>
          </div>
        </div>

        <div class="doc-verify-layout">
          <!-- Left Column: Upload Dropzone & Live OCR Visualizer -->
          <div>
            <div class="card">
              <div class="card-header">
                <div>
                  <div class="card-title">${Icons.get('uploadCloud', 20)} Drag &amp; Drop Deed Document</div>
                  <div class="card-description">Supports PDF, TIFF, scanned notary certificates (Max 25MB)</div>
                </div>
                <span class="badge badge-neutral">OCR v4.2 Active</span>
              </div>

              <!-- Upload Dropzone Area -->
              <div class="upload-dropzone" id="doc-dropzone" onclick="window.DocVerificationView.triggerVerification()">
                <div class="upload-icon-circle">
                  ${Icons.get('fileText', 28)}
                </div>
                <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">
                  ${data.fileName}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">
                  ${data.fileSize} • Click to Re-Run Full Cryptographic Verification
                </div>
                <button class="btn btn-primary btn-sm" style="margin-top: 8px;">
                  ${this.isVerifying ? 'Analyzing Document On-Chain...' : 'Start 4-Stage Verification Scan'}
                </button>
              </div>

              <!-- Sequence Progress Display -->
              <div style="margin-top: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px;">
                  Real-Time Verification Sequence
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 8px 12px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${this.getStageIcon(1)} <span>1. Document Ingestion &amp; Image Normalization</span>
                    </div>
                    <span class="mono" style="font-size: 10px; color: var(--verified-emerald);">${this.verificationStage >= 1 ? 'COMPLETED' : 'PENDING'}</span>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 8px 12px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${this.getStageIcon(2)} <span>2. High-Precision Legal OCR Text Extraction</span>
                    </div>
                    <span class="mono" style="font-size: 10px; color: var(--verified-emerald);">${this.verificationStage >= 2 ? 'COMPLETED' : 'PENDING'}</span>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 8px 12px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${this.getStageIcon(3)} <span>3. SHA-256 Cryptographic Hash Generation</span>
                    </div>
                    <span class="mono" style="font-size: 10px; color: var(--verified-emerald);">${this.verificationStage >= 3 ? 'COMPLETED' : 'PENDING'}</span>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 8px 12px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${this.getStageIcon(4)} <span>4. Cadastre Ledger Consensus Cross-Examination</span>
                    </div>
                    <span class="mono" style="font-size: 10px; color: var(--verified-emerald);">${this.verificationStage >= 4 ? 'COMPLETED' : 'PENDING'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Verification Result & Zero-Trust URL Scanner -->
          <div>
            <div class="card ${data.status === 'VERIFIED_AUTHENTIC' ? 'card-highlight' : ''}" style="${data.status === 'TAMPERING_DETECTED' ? 'border-color: rgba(239, 68, 68, 0.4); box-shadow: var(--shadow-red);' : ''}">
              <div class="card-header">
                <div>
                  <div class="card-title">${Icons.get('shield', 20)} Verification Diagnostic Result</div>
                  <div class="card-description">Target Registry: GLR-GB-9821 (Kensington Subnet)</div>
                </div>
                <span class="badge ${data.status === 'VERIFIED_AUTHENTIC' ? 'badge-verified' : 'badge-danger'}">
                  ${data.status === 'VERIFIED_AUTHENTIC' ? 'Verified & Authentic ✓' : 'Tampering Detected ✗'}
                </span>
              </div>

              <!-- Result Status Banner -->
              <div style="padding: 16px; border-radius: var(--radius-md); background: ${data.status === 'VERIFIED_AUTHENTIC' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; border: 1px solid ${data.status === 'VERIFIED_AUTHENTIC' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="color: ${data.status === 'VERIFIED_AUTHENTIC' ? 'var(--verified-emerald)' : 'var(--critical-red)'}; font-size: 24px;">
                    ${data.status === 'VERIFIED_AUTHENTIC' ? Icons.get('checkCircle', 32) : Icons.get('alertTriangle', 32)}
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 16px; color: var(--text-primary);">
                      ${data.status === 'VERIFIED_AUTHENTIC' ? 'Deed Integrity 100% Cryptographically Confirmed' : 'Security Alert: Unauthorized Deed Modification Detected'}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                      ${data.status === 'VERIFIED_AUTHENTIC' ? 'The digital hash matches the genesis record sealed by HM Land Registry.' : 'Hash signature mismatch found in paragraph 4.2 (Parcel boundary altered).'}
                    </div>
                  </div>
                </div>
              </div>

              <!-- SHA-256 Hash Box -->
              <div class="form-group">
                <label class="form-label">Extracted Document SHA-256 Hash</label>
                <div style="display: flex; gap: 8px;">
                  <input type="text" class="form-input mono" style="font-size: 11px; flex: 1;" value="${data.sha256Hash}" readonly />
                  <button class="btn btn-secondary btn-sm" onclick="App.copyToClipboard('${data.sha256Hash}')">
                    ${Icons.get('copy', 14)}
                  </button>
                </div>
              </div>

              <!-- Extracted Legal Clauses Breakdown -->
              <div style="margin-top: 16px;">
                <div class="form-label" style="margin-bottom: 8px;">Extracted Clause Validation Breakdown</div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${data.clauses.map(cl => `
                    <div class="ocr-result-item" style="border-left: 3px solid ${cl.status === 'MATCH' ? 'var(--verified-emerald)' : 'var(--critical-red)'};">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="ocr-field-label">${cl.label}</div>
                        <span class="badge ${cl.status === 'MATCH' ? 'badge-verified' : 'badge-danger'} btn-sm" style="font-size: 9px;">
                          ${cl.status === 'MATCH' ? 'Exact Match' : 'Discrepancy Detected'}
                        </span>
                      </div>
                      <div class="ocr-field-val">${cl.value}</div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Zero-Trust URL Scanner Section -->
              <div class="zt-url-scanner">
                <div class="zt-url-info">
                  <div class="zt-shield-icon ${data.linksFound[0].status === 'SAFE' ? 'safe' : 'unsafe'}">
                    ${data.linksFound[0].status === 'SAFE' ? Icons.get('shield', 16) : Icons.get('alertTriangle', 16)}
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 12px; color: var(--text-primary);">Zero-Trust Document Link Scanner</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">
                      ${data.linksFound.length} embedded URLs/QRs verified: <strong>${data.linksFound[0].url}</strong>
                    </div>
                  </div>
                </div>
                <span class="badge ${data.linksFound[0].status === 'SAFE' ? 'badge-verified' : 'badge-danger'} btn-sm">
                  ${data.linksFound[0].status === 'SAFE' ? 'Zero Phishing Risks' : 'Malicious Link Flagged'}
                </span>
              </div>

              <!-- Action Footer -->
              <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="btn btn-secondary" style="flex: 1;" onclick="window.Router.navigate('property')">
                  ${Icons.get('home', 16)} View Cadastre Record
                </button>
                <button class="btn btn-primary" style="flex: 1;" onclick="window.Router.navigate('transaction')">
                  ${Icons.get('lock', 16)} Proceed to Escrow
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getStageIcon: function(stageNum) {
    if (this.verificationStage >= stageNum) {
      return `<span style="color: var(--verified-emerald);">${Icons.get('checkCircle', 16)}</span>`;
    }
    return `<span style="color: var(--text-muted);">${Icons.get('cpu', 16)}</span>`;
  },

  selectSample: function(sampleKey) {
    this.activeSample = sampleKey;
    this.verificationStage = 5;
    this.render(document.getElementById('view-container'));
    App.showToast(`Switched to sample: ${sampleKey.toUpperCase()}`, 'info');
  },

  triggerVerification: function() {
    this.isVerifying = true;
    this.verificationStage = 1;
    this.render(document.getElementById('view-container'));
    App.showToast('Starting multi-stage verification analysis...', 'info');

    setTimeout(() => {
      this.verificationStage = 2;
      this.render(document.getElementById('view-container'));
    }, 400);

    setTimeout(() => {
      this.verificationStage = 3;
      this.render(document.getElementById('view-container'));
    }, 800);

    setTimeout(() => {
      this.verificationStage = 4;
      this.render(document.getElementById('view-container'));
    }, 1200);

    setTimeout(() => {
      this.verificationStage = 5;
      this.isVerifying = false;
      this.render(document.getElementById('view-container'));
      if (this.activeSample === 'authentic') {
        App.showToast('Document Authenticity 100% Confirmed!', 'success');
      } else {
        App.showToast('ALERT: Unauthorized Document Tampering Detected!', 'error');
      }
    }, 1600);
  }
};
