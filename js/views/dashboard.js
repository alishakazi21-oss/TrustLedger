// View 3: User Dashboard (Main Hub)
window.DashboardView = {
  render: function(container) {
    const user = AppState.getCurrentUser();
    const activeTx = AppState.activeTransaction;
    const properties = AppState.properties;

    container.innerHTML = `
      <div class="page-container">
        <!-- View Header -->
        <div class="view-header">
          <div class="view-title-group">
            <h1>TrustLedger Command Hub</h1>
            <p>Institutional overview for <strong>${user.name}</strong> • ${user.roleTitle}</p>
          </div>
          <div class="view-actions">
            <button class="btn btn-outline-verified btn-sm" onclick="window.Router.navigate('verifier-app')">
              ${Icons.get('qrCode', 16)} Scan QR Credential
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.Router.navigate('verify-doc')">
              ${Icons.get('fileText', 16)} Verify Document
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.Router.navigate('transaction')">
              ${Icons.get('lock', 16)} Open Active Escrow
            </button>
          </div>
        </div>

        <!-- Metric Summary Cards Grid -->
        <div class="dashboard-metrics-grid">
          <!-- Card 1: Identity Status -->
          <div class="metric-card card-highlight">
            <div class="metric-header">
              <span class="metric-title">Identity Status</span>
              <div class="metric-icon-wrap">${Icons.get('shield', 18)}</div>
            </div>
            <div class="metric-value" style="font-size: 1.5rem; color: var(--verified-emerald);">
              ${user.isKycVerified ? 'Tier 3 Verified' : 'Unverified'}
            </div>
            <div class="metric-footer">
              <span class="badge badge-verified btn-sm">W3C DID Active</span>
              <span style="font-size: 11px; color: var(--text-muted);">99.4% Rep Score</span>
            </div>
          </div>

          <!-- Card 2: Properties Owned -->
          <div class="metric-card" onclick="window.Router.navigate('property')" style="cursor: pointer;">
            <div class="metric-header">
              <span class="metric-title">Properties Registered</span>
              <div class="metric-icon-wrap" style="color: var(--info-blue);">${Icons.get('home', 18)}</div>
            </div>
            <div class="metric-value">${properties.length}</div>
            <div class="metric-footer">
              <span style="color: var(--text-secondary);">Est. Valuation: <strong>$18.05M USD</strong></span>
            </div>
          </div>

          <!-- Card 3: Active Transactions -->
          <div class="metric-card" onclick="window.Router.navigate('transaction')" style="cursor: pointer;">
            <div class="metric-header">
              <span class="metric-title">Active Escrow</span>
              <div class="metric-icon-wrap" style="color: var(--verified-teal);">${Icons.get('repeat', 18)}</div>
            </div>
            <div class="metric-value">1 <span style="font-size: 14px; font-weight: 500; color: var(--text-secondary);">In Progress</span></div>
            <div class="metric-footer">
              <span class="badge badge-info btn-sm">Step 3 of 5 (Verification)</span>
            </div>
          </div>

          <!-- Card 4: Security & Alerts -->
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Security &amp; Hash Health</span>
              <div class="metric-icon-wrap" style="color: var(--verified-emerald);">${Icons.get('checkCircle', 18)}</div>
            </div>
            <div class="metric-value" style="font-size: 1.5rem; color: var(--verified-emerald);">0 Threats</div>
            <div class="metric-footer">
              <span style="color: var(--text-secondary);">All 14 linked nodes synced ✓</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions Bar -->
        <div class="card" style="margin-bottom: 24px; padding: 18px 24px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="font-weight: 700; font-size: 14px;">Instant Execution Shortcuts</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Perform on-chain cryptographic operations without gas fees.</div>
            </div>
            <div class="quick-actions-bar" style="margin-bottom: 0;">
              <button class="btn btn-secondary btn-sm" onclick="window.Router.navigate('verify-doc')">
                ${Icons.get('fileText', 14)} Verify a Title Deed
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.Router.navigate('property')">
                ${Icons.get('home', 14)} Inspect Cadastral Map
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.Router.navigate('transaction')">
                ${Icons.get('repeat', 14)} Approve Escrow Transfer
              </button>
              <button class="btn btn-outline-verified btn-sm" onclick="window.Router.navigate('onboarding')">
                ${Icons.get('user', 14)} View DID Credentials
              </button>
            </div>
          </div>
        </div>

        <!-- Two Column Layout: Active Escrow Highlight + Audit Trail -->
        <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px;">
          <!-- Left Col: Active Transaction Spotlight -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">${Icons.get('repeat', 20)} In-Flight Property Settlement</div>
                <div class="card-description">Transaction ID: <span class="mono">${activeTx.txId}</span></div>
              </div>
              <span class="badge badge-info">Step 3/5 In Progress</span>
            </div>

            <div style="padding: 12px 16px; background: var(--bg-surface-elevated); border-radius: var(--radius-md); margin-bottom: 16px; border: 1px solid var(--glass-border);">
              <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${activeTx.propertyTitle}</div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px;">
                <span style="color: var(--text-secondary);">Agreed Value: <strong>${activeTx.priceUsd}</strong></span>
                <span style="color: var(--verified-emerald);">Escrow Vault: <strong>${activeTx.escrowDepositUsd}</strong></span>
              </div>
            </div>

            <!-- Mini Step Pipeline -->
            <div class="escrow-pipeline" style="grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 16px;">
              ${activeTx.steps.map((st, idx) => `
                <div class="pipeline-step ${st.status === 'completed' ? 'completed' : (st.status === 'in-progress' ? 'active' : '')}" style="padding: 8px 10px;">
                  <div class="pipeline-step-num" style="font-size: 9px;">Step ${idx + 1}</div>
                  <div class="pipeline-step-title" style="font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${st.name}</div>
                  <div class="pipeline-status-tag" style="font-size: 9px; color: ${st.status === 'completed' ? 'var(--verified-emerald)' : (st.status === 'in-progress' ? 'var(--info-blue)' : 'var(--text-muted)')};">
                    ${st.status === 'completed' ? '✓ Done' : (st.status === 'in-progress' ? '● Active' : '○ Wait')}
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="sponsor-fee-banner" style="margin-top: 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${Icons.get('checkCircle', 16)}
                <span>Network Protocol Fee: <strong>Sponsored (0.00 USD)</strong></span>
              </div>
              <button class="btn btn-primary btn-sm" onclick="window.Router.navigate('transaction')">
                View Escrow Workspace ${Icons.get('arrowRight', 14)}
              </button>
            </div>
          </div>

          <!-- Right Col: Digital DID Card Quick Glance -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">${Icons.get('user', 20)} Decentralized ID (DID)</div>
                <div class="card-description">Cryptographically anchored to TrustLedger</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="App.copyToClipboard('${user.did}')">
                ${Icons.get('copy', 14)} Copy DID
              </button>
            </div>

            <!-- Mini DID display -->
            <div style="background: linear-gradient(135deg, rgba(16, 32, 52, 0.9), rgba(3, 20, 39, 0.9)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-lg); padding: 18px; position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--verified-emerald); letter-spacing: 0.05em;">TrustLedger ID Card</div>
                  <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${user.name}</div>
                  <div class="mono" style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">${user.did}</div>
                </div>
                <span class="badge badge-verified">Tier 3 Verified</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; border-top: 1px solid rgba(148, 163, 184, 0.1); padding-top: 12px; font-size: 11px;">
                <div>
                  <span style="color: var(--text-muted);">Issuer:</span>
                  <div style="font-weight: 600; color: var(--text-primary);">HM Land &amp; Identity Auth</div>
                </div>
                <div>
                  <span style="color: var(--text-muted);">Audit Proof:</span>
                  <div class="mono" style="color: var(--verified-emerald);">SHA-256 ✓ Valid</div>
                </div>
              </div>
            </div>

            <div style="margin-top: 16px; display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.Router.navigate('onboarding')">
                Re-verify Credentials
              </button>
              <button class="btn btn-outline-verified btn-sm" style="flex: 1;" onclick="window.Router.navigate('verifier-app')">
                Open QR Verifier
              </button>
            </div>
          </div>
        </div>

        <!-- Recent Audit Trail Section -->
        <div class="card" style="margin-top: 24px;">
          <div class="card-header">
            <div>
              <div class="card-title">${Icons.get('layers', 20)} Immutable Audit Trail &amp; On-Chain History</div>
              <div class="card-description">Tamper-proof event sequence logged on the TrustLedger subnet</div>
            </div>
            <span class="badge badge-neutral">Live Feed</span>
          </div>

          <div style="overflow-x: auto;">
            <table class="audit-table">
              <thead>
                <tr>
                  <th>Event / Action</th>
                  <th>Actor</th>
                  <th>Target Record</th>
                  <th>Block Number</th>
                  <th>Tx Hash</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${AppState.auditTrail.map(ev => `
                  <tr>
                    <td style="font-weight: 600; color: var(--text-primary);">${ev.action}</td>
                    <td>${ev.actor}</td>
                    <td><span class="mono" style="font-size: 11px;">${ev.target}</span></td>
                    <td><span class="mono" style="font-size: 11px; color: var(--info-blue);">${ev.block}</span></td>
                    <td>
                      <span class="block-hash-pill" onclick="App.copyToClipboard('${ev.txHash}')" style="cursor: pointer;">
                        ${ev.txHash} ${Icons.get('copy', 10)}
                      </span>
                    </td>
                    <td><span class="badge badge-verified btn-sm">${ev.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
};
