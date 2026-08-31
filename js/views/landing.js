// View 1: Landing / Login Screen
window.LandingView = {
  render: function(container) {
    container.innerHTML = `
      <div class="landing-hero">
        <!-- Top Nav for Landing -->
        <div class="landing-nav">
          <div class="brand-logo" onclick="window.Router.navigate('landing')">
            <div class="logo-icon-wrap">
              ${Icons.get('shield', 22)}
            </div>
            <div class="brand-title">Trust<span>Ledger</span></div>
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <button class="btn btn-secondary btn-sm" onclick="window.LandingView.openLoginModal()">Sign In</button>
            <button class="btn btn-primary btn-sm" onclick="window.Router.navigate('onboarding')">
              ${Icons.get('checkCircle', 16)} Start e-KYC Verification
            </button>
          </div>
        </div>

        <!-- Hero Content -->
        <div style="max-width: 960px; margin: 60px auto 20px; text-align: center;">
          <div class="hero-pill-badge">
            ${Icons.get('shield', 14)} Enterprise Digital Trust & Blockchain Cadastre
          </div>
          <h1 class="hero-title">
            The Digital Trust &amp; Property Transaction Platform
          </h1>
          <p class="hero-tagline">
            "Verify the Person. Verify the Property. Secure the Transaction."
          </p>
          <p style="max-width: 720px; margin: 0 auto 32px; font-size: 1.1rem; color: var(--text-secondary);">
            Execute high-stakes real estate transactions on-chain with bank-grade biometric KYC, AI-assisted legal deed hashing, and gasless multi-signature escrow.
          </p>

          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary btn-lg" onclick="window.Router.navigate('onboarding')">
              ${Icons.get('user', 18)} Set Up Digital Identity (e-KYC)
            </button>
            <button class="btn btn-secondary btn-lg" onclick="window.Router.navigate('dashboard')">
              ${Icons.get('layers', 18)} Open User Dashboard
            </button>
            <button class="btn btn-outline-verified btn-lg" onclick="window.LandingView.openDemoModal()">
              ${Icons.get('cpu', 18)} Explore Demo Personas &amp; Roles
            </button>
          </div>
        </div>

        <!-- 3-Step Connected Workflow Visual -->
        <div class="hero-3step-visual">
          <div class="step-visual-card">
            <div class="step-number-tag">STEP 01</div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="color: var(--verified-emerald);">${Icons.get('user', 24)}</div>
              <div class="step-visual-title">Verify Person</div>
            </div>
            <p style="font-size: 13px;">
              Instant biometric liveness detection and government ID tokenization. Generates a W3C-compliant Verifiable Digital Identity (DID).
            </p>
            <div style="margin-top: 12px; font-size: 11px; color: var(--verified-emerald); font-weight: 600;">
              ✓ Tier-3 Bank-Grade KYC
            </div>
          </div>

          <div class="step-visual-card">
            <div class="step-number-tag">STEP 02</div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="color: var(--info-blue);">${Icons.get('fileText', 24)}</div>
              <div class="step-visual-title">Verify Property</div>
            </div>
            <p style="font-size: 13px;">
              Automated deed OCR extraction, cryptographic SHA-256 fingerprinting, and real-time cadastre boundary cross-checking.
            </p>
            <div style="margin-top: 12px; font-size: 11px; color: var(--info-blue); font-weight: 600;">
              ✓ Zero-Tampering Guarantee
            </div>
          </div>

          <div class="step-visual-card">
            <div class="step-number-tag">STEP 03</div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="color: var(--verified-teal);">${Icons.get('lock', 24)}</div>
              <div class="step-visual-title">Secure Transaction</div>
            </div>
            <p style="font-size: 13px;">
              Automated multi-sig escrow with instant settlement. Gas fees are 100% sponsored by TrustLedger protocol relayers.
            </p>
            <div style="margin-top: 12px; font-size: 11px; color: var(--verified-teal); font-weight: 600;">
              ✓ Gas-Free &amp; Frictionless
            </div>
          </div>
        </div>

        <!-- Quick Login / Authentication Card -->
        <div class="landing-auth-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h3 style="font-size: 18px;">Access Portal</h3>
            <span class="badge badge-verified">256-Bit SSL</span>
          </div>
          
          <form onsubmit="window.LandingView.handleLogin(event)">
            <div class="form-group">
              <label class="form-label">Email / Registered DID</label>
              <input type="email" class="form-input" id="login-email" value="alex.sterling@globaltrust.io" required />
            </div>
            <div class="form-group">
              <label class="form-label">Passkey / Master Password</label>
              <input type="password" class="form-input" id="login-pass" value="••••••••••••" required />
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
              ${Icons.get('lock', 16)} Sign In Securely
            </button>
          </form>

          <div style="position: relative; text-align: center; margin: 20px 0;">
            <hr style="border: 0; border-top: 1px solid var(--glass-border);" />
            <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--bg-surface-elevated); padding: 0 12px; font-size: 11px; color: var(--text-muted); font-weight: 600;">OR</span>
          </div>

          <button class="btn btn-outline-verified" style="width: 100%;" onclick="window.Router.navigate('onboarding')">
            ${Icons.get('shield', 16)} Verify with Government ID (e-KYC)
          </button>
        </div>

        <!-- Trust Indicators Footer -->
        <div class="trust-indicators-row">
          <div class="trust-indicator-item">
            ${Icons.get('lock', 16, 'text-emerald')} SHA-256 Cryptographic Proof
          </div>
          <div class="trust-indicator-item">
            ${Icons.get('checkCircle', 16, 'text-emerald')} Zero Gas Fee Relayer (Sponsored)
          </div>
          <div class="trust-indicator-item">
            ${Icons.get('shield', 16, 'text-emerald')} W3C Verifiable Credentials Standard
          </div>
          <div class="trust-indicator-item">
            ${Icons.get('layers', 16, 'text-emerald')} Immutable Cadastral Audit Log
          </div>
        </div>
      </div>
    `;
  },

  handleLogin: function(e) {
    if (e) e.preventDefault();
    App.showToast('Authentication successful! Welcome to TrustLedger.', 'success');
    window.Router.navigate('dashboard');
  },

  openLoginModal: function() {
    window.LandingView.handleLogin();
  },

  openDemoModal: function() {
    const modalHtml = `
      <div class="modal-backdrop" id="demo-modal" onclick="if(event.target.id==='demo-modal') App.closeModal()">
        <div class="modal-content" style="max-width: 600px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3>Select a Demo Persona</h3>
            <button class="btn btn-secondary btn-sm" onclick="App.closeModal()">${Icons.get('x', 16)}</button>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
            Switch instantly between different perspectives in the real-estate & digital trust transaction lifecycle.
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div class="card" style="cursor: pointer; padding: 14px;" onclick="window.LandingView.switchAndGo('buyer', 'dashboard')">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; color: var(--text-primary);">1. Alexander Sterling (Property Buyer)</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Looking to purchase Kensington Heritage Estate via smart escrow.</div>
                </div>
                <span class="badge badge-verified">Buyer</span>
              </div>
            </div>

            <div class="card" style="cursor: pointer; padding: 14px;" onclick="window.LandingView.switchAndGo('seller', 'property')">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; color: var(--text-primary);">2. Helena Vance-Croft (Property Seller)</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Holding title deed v2.1 with verified cadastral boundaries.</div>
                </div>
                <span class="badge badge-verified">Seller</span>
              </div>
            </div>

            <div class="card" style="cursor: pointer; padding: 14px;" onclick="window.LandingView.switchAndGo('verifier', 'verifier-app')">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; color: var(--text-primary);">3. Barclays Escrow Officer (Verifier)</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Runs fast DID QR lookups & instant verifiable credential validation.</div>
                </div>
                <span class="badge badge-info">Verifier</span>
              </div>
            </div>

            <div class="card" style="cursor: pointer; padding: 14px;" onclick="window.LandingView.switchAndGo('registrar', 'registrar-web')">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; color: var(--text-primary);">4. Hon. Eleanor Vance (Property Registrar)</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Approves cadastral amendments and seals deeds to the state ledger.</div>
                </div>
                <span class="badge badge-warning">Registrar</span>
              </div>
            </div>

            <div class="card" style="cursor: pointer; padding: 14px;" onclick="window.LandingView.switchAndGo('admin', 'admin-console')">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; color: var(--text-primary);">5. Security &amp; Protocol Admin</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">Monitors ledger nodes, fraud mitigation, and credential revocation registry.</div>
                </div>
                <span class="badge badge-danger">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    App.openModalHtml(modalHtml);
  },

  switchAndGo: function(persona, targetView) {
    AppState.setPersona(persona);
    App.closeModal();
    App.showToast(`Switched persona to: ${AppState.getCurrentUser().name}`, 'success');
    window.Router.navigate(targetView);
  }
};
