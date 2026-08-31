// View 2: Onboarding - Digital Identity Setup (Multi-step wizard)
window.OnboardingView = {
  currentStep: 1,
  formData: {
    fullName: 'Alexander Sterling',
    dob: '1988-06-14',
    country: 'United Kingdom',
    idType: 'Passport / National ID Card',
    idNumber: 'GB-992014881-X',
    address: '14 Mayfair Gardens, London W1K 2PB',
    didString: 'did:trust:0x892a4f91e920d3f44bb519e0',
    keyFingerprint: '0x9924cb981f...3a401c',
    issuanceDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  },
  isScanningCamera: false,

  render: function(container) {
    const step = this.currentStep;
    const progressWidth = ((step - 1) / 3) * 100;

    container.innerHTML = `
      <div class="page-container onboarding-container">
        <!-- View Header -->
        <div class="view-header" style="text-align: center; justify-content: center; flex-direction: column; align-items: center;">
          <div class="hero-pill-badge" style="margin-bottom: 8px;">
            ${Icons.get('shield', 14)} W3C Verifiable Credential Standard
          </div>
          <h1>Digital Identity &amp; e-KYC Onboarding</h1>
          <p>Establish your cryptographic Decentralized Identity (DID) to execute verifiable property transactions.</p>
        </div>

        <!-- Multi-Step Progress Tracker -->
        <div class="stepper-horizontal" style="margin: 32px 0;">
          <div class="step-progress-bar" style="width: ${progressWidth}%;"></div>
          
          <div class="step-node ${step >= 1 ? (step === 1 ? 'active' : 'completed') : ''}">
            <div class="step-circle">${step > 1 ? Icons.get('checkCircle', 18) : '1'}</div>
            <div class="step-label">1. Basic Details</div>
          </div>

          <div class="step-node ${step >= 2 ? (step === 2 ? 'active' : 'completed') : ''}">
            <div class="step-circle">${step > 2 ? Icons.get('checkCircle', 18) : '2'}</div>
            <div class="step-label">2. e-KYC &amp; Biometrics</div>
          </div>

          <div class="step-node ${step >= 3 ? (step === 3 ? 'active' : 'completed') : ''}">
            <div class="step-circle">${step > 3 ? Icons.get('checkCircle', 18) : '3'}</div>
            <div class="step-label">3. DID Card Preview</div>
          </div>

          <div class="step-node ${step >= 4 ? 'active completed' : ''}">
            <div class="step-circle">${step === 4 ? Icons.get('checkCircle', 18) : '4'}</div>
            <div class="step-label">4. Issuance Success</div>
          </div>
        </div>

        <!-- Step Container Card -->
        <div class="card" style="margin-top: 24px;">
          ${this.renderStepContent(step)}
        </div>
      </div>
    `;
  },

  renderStepContent: function(step) {
    switch(step) {
      case 1:
        return `
          <div class="card-header">
            <div>
              <div class="card-title">${Icons.get('user', 20)} Step 1: Legal Identity &amp; Residency</div>
              <div class="card-description">Enter your government-recognized legal details. These will be bound to your zero-knowledge DID.</div>
            </div>
            <span class="badge badge-neutral">Drafting Claim</span>
          </div>

          <form onsubmit="window.OnboardingView.goToStep(2); return false;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label">Full Legal Name</label>
                <input type="text" class="form-input" id="ob-name" value="${this.formData.fullName}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input type="date" class="form-input" id="ob-dob" value="${this.formData.dob}" required />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label">Country of Legal Citizenship</label>
                <input type="text" class="form-input" id="ob-country" value="${this.formData.country}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Identity Document Type</label>
                <select class="form-select" id="ob-idtype">
                  <option>Biometric Passport (e-Passport)</option>
                  <option>National Citizen ID Card</option>
                  <option>Driver's License (Gov Verified)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Official Document / Tax Identification Number</label>
              <input type="text" class="form-input" id="ob-idnum" value="${this.formData.idNumber}" required />
            </div>

            <div class="form-group">
              <label class="form-label">Registered Residential Address</label>
              <input type="text" class="form-input" id="ob-address" value="${this.formData.address}" required />
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
              <button type="button" class="btn btn-secondary" onclick="window.Router.navigate('landing')">Cancel</button>
              <button type="submit" class="btn btn-primary">
                Proceed to Biometric e-KYC ${Icons.get('arrowRight', 16)}
              </button>
            </div>
          </form>
        `;

      case 2:
        return `
          <div class="card-header">
            <div>
              <div class="card-title">${Icons.get('camera', 20)} Step 2: Biometric Liveness &amp; Document Capture</div>
              <div class="card-description">Upload your government ID and complete real-time 3D facial liveness verification.</div>
            </div>
            <span class="badge badge-verified">Zero-Knowledge ZK-SNARK</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- Document Upload Box -->
            <div>
              <label class="form-label">Government ID Scan (Front &amp; Back)</label>
              <div class="upload-dropzone" style="padding: 24px;" onclick="App.showToast('Passport document GB-992014881 loaded and verified.', 'success')">
                <div class="upload-icon-circle" style="width: 48px; height: 48px;">
                  ${Icons.get('fileText', 24)}
                </div>
                <div style="font-weight: 600; font-size: 13px;">Passport_Alexander_Sterling.pdf</div>
                <div style="font-size: 11px; color: var(--text-muted);">2.4 MB • SHA-256 Validated ✓</div>
                <span class="badge badge-verified btn-sm" style="margin-top: 8px;">Document Match 100%</span>
              </div>
            </div>

            <!-- Live Camera Liveness Box -->
            <div>
              <label class="form-label">3D Biometric Facial Liveness</label>
              <div class="selfie-camera-preview" id="liveness-box">
                <div class="biometric-oval">
                  <div class="biometric-scan-bar"></div>
                  <div style="color: var(--verified-emerald); font-size: 32px;">
                    ${Icons.get('user', 48)}
                  </div>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; color: var(--verified-emerald); font-weight: 600;">
                  ● Liveness Detected (Anti-Spoofing Valid)
                </span>
                <button class="btn btn-secondary btn-sm" onclick="window.OnboardingView.rescanBiometrics()">
                  ${Icons.get('repeat', 12)} Re-scan
                </button>
              </div>
            </div>
          </div>

          <div class="zt-url-scanner" style="margin-top: 20px;">
            <div class="zt-url-info">
              <div class="zt-shield-icon safe">${Icons.get('shield', 16)}</div>
              <div>
                <div style="font-weight: 600; font-size: 13px;">Government Identity Gateway (HM Passport Office)</div>
                <div style="font-size: 11px; color: var(--text-muted);">Instant cryptographic signature check against central passport database.</div>
              </div>
            </div>
            <span class="badge badge-verified">Passed (Response 180ms)</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
            <button type="button" class="btn btn-secondary" onclick="window.OnboardingView.goToStep(1)">Back</button>
            <button type="button" class="btn btn-primary" onclick="window.OnboardingView.goToStep(3)">
              Generate Decentralized ID (DID) ${Icons.get('arrowRight', 16)}
            </button>
          </div>
        `;

      case 3:
        return `
          <div class="card-header">
            <div>
              <div class="card-title">${Icons.get('key', 20)} Step 3: DID Generation &amp; Key Pair Preview</div>
              <div class="card-description">Your decentralized identity card has been cryptographically generated on-chain.</div>
            </div>
            <span class="badge badge-verified">Ready to Issue</span>
          </div>

          <p style="text-align: center; font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
            This Verifiable Digital Identity Card gives you one-click signing for property titles, escrows, and notary verifications without disclosing raw passport numbers.
          </p>

          <!-- The Visual DID Card Preview -->
          <div class="did-identity-card">
            <div class="did-card-top">
              <div class="did-card-issuer">
                ${Icons.get('shield', 16, 'text-emerald')} TrustLedger Sovereign ID
              </div>
              <div class="did-card-chip"></div>
            </div>

            <div class="did-card-body">
              <div class="did-avatar-box">
                <div style="font-weight: 800; font-size: 20px; color: var(--verified-emerald);">AS</div>
              </div>
              <div class="did-user-details">
                <div class="did-user-name">${this.formData.fullName}</div>
                <div class="did-identifier">${this.formData.didString}</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                  Tier 3 Institutional Accredited Buyer
                </div>
              </div>
            </div>

            <div class="did-card-footer">
              <div class="did-meta-col">
                <div class="did-meta-title">Public Key Hash</div>
                <div class="did-meta-value mono">${this.formData.keyFingerprint}</div>
              </div>
              <div class="did-meta-col">
                <div class="did-meta-title">Issue Date</div>
                <div class="did-meta-value">${this.formData.issuanceDate}</div>
              </div>
              <div class="did-qr-mini">
                <svg viewBox="0 0 100 100" fill="#031427">
                  <rect x="10" y="10" width="30" height="30" fill="#031427"/>
                  <rect x="15" y="15" width="20" height="20" fill="white"/>
                  <rect x="20" y="20" width="10" height="10" fill="#031427"/>
                  <rect x="60" y="10" width="30" height="30" fill="#031427"/>
                  <rect x="65" y="15" width="20" height="20" fill="white"/>
                  <rect x="70" y="20" width="10" height="10" fill="#031427"/>
                  <rect x="10" y="60" width="30" height="30" fill="#031427"/>
                  <rect x="15" y="65" width="20" height="20" fill="white"/>
                  <rect x="20" y="70" width="10" height="10" fill="#031427"/>
                  <rect x="50" y="50" width="15" height="15" fill="#031427"/>
                  <rect x="70" y="70" width="20" height="20" fill="#031427"/>
                </svg>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 32px;">
            <button type="button" class="btn btn-secondary" onclick="window.OnboardingView.goToStep(2)">Back</button>
            <button type="button" class="btn btn-primary" onclick="window.OnboardingView.finalizeIssuance()">
              ${Icons.get('checkCircle', 16)} Finalize &amp; Seal Credential
            </button>
          </div>
        `;

      case 4:
        return `
          <div style="text-align: center; padding: 20px 0;">
            <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--verified-emerald-dim); border: 2px solid var(--verified-emerald); color: var(--verified-emerald); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 0 24px var(--verified-emerald-glow);">
              ${Icons.get('checkCircle', 40)}
            </div>

            <h2 style="font-size: 24px; margin-bottom: 8px;">Decentralized Identity Issued &amp; Verified!</h2>
            <p style="max-width: 560px; margin: 0 auto 24px; color: var(--text-secondary);">
              Your identity has been anchored to the TrustLedger Root Registry. You can now execute gas-free legal contracts, purchase properties, and verify deeds.
            </p>

            <div class="card" style="max-width: 500px; margin: 0 auto 24px; text-align: left; background: rgba(3, 20, 39, 0.6);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="badge badge-verified">Verified Credential: Active</span>
                <span class="mono" style="font-size: 11px;">Block #7,882,912</span>
              </div>
              <div style="font-size: 12px; margin-bottom: 6px;">
                <strong style="color: var(--text-primary);">DID Identifier:</strong>
                <div class="mono" style="word-break: break-all; color: var(--verified-emerald); margin-top: 2px;">${this.formData.didString}</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; font-size: 12px;">
                <div>
                  <span style="color: var(--text-muted);">Trust Level:</span>
                  <div style="font-weight: 600; color: var(--text-primary);">Tier 3 (Institutional)</div>
                </div>
                <div>
                  <span style="color: var(--text-muted);">Gasless Relayer:</span>
                  <div style="font-weight: 600; color: var(--verified-emerald);">Active (Sponsored ✓)</div>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
              <button class="btn btn-primary btn-lg" onclick="window.Router.navigate('dashboard')">
                ${Icons.get('layers', 18)} Go to User Dashboard
              </button>
              <button class="btn btn-secondary btn-lg" onclick="window.Router.navigate('verify-doc')">
                ${Icons.get('fileText', 18)} Verify a Property Deed
              </button>
              <button class="btn btn-outline-verified btn-lg" onclick="window.Router.navigate('transaction')">
                ${Icons.get('lock', 18)} View Active Escrow
              </button>
            </div>
          </div>
        `;
    }
  },

  goToStep: function(stepNumber) {
    if (stepNumber === 2) {
      const nameInput = document.getElementById('ob-name');
      if (nameInput) this.formData.fullName = nameInput.value;
    }
    this.currentStep = stepNumber;
    this.render(document.getElementById('view-container'));
  },

  rescanBiometrics: function() {
    App.showToast('Re-calibrating biometric optical scan...', 'info');
    const livenessBox = document.getElementById('liveness-box');
    if (livenessBox) {
      livenessBox.style.borderColor = '#f59e0b';
      setTimeout(() => {
        livenessBox.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        App.showToast('Liveness re-scan successful: 99.8% Match', 'success');
      }, 1000);
    }
  },

  finalizeIssuance: function() {
    App.showToast('Sealing credential hash to consensus block...', 'info');
    setTimeout(() => {
      this.goToStep(4);
      App.showToast('Decentralized Identity successfully minted!', 'success');
    }, 800);
  }
};
