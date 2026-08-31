// View 9: Admin Console (Platform Stats, Node Consensus & Revocation Registry)
window.AdminConsoleView = {
  users: [
    {
      id: 'USR-8921',
      name: 'Alexander Sterling',
      email: 'alex.sterling@globaltrust.io',
      role: 'Verified Buyer',
      did: 'did:trust:0x892a4f91e920d3f44bb519e0',
      tier: 'Tier 3 (Institutional)',
      status: 'ACTIVE',
      lastActive: '3 mins ago'
    },
    {
      id: 'USR-4019',
      name: 'Helena Vance-Croft',
      email: 'helena.vance@vanceholdings.co.uk',
      role: 'Property Owner',
      did: 'did:trust:0x44fa71bb092e01ff3941a80c',
      tier: 'Tier 3 (Institutional)',
      status: 'ACTIVE',
      lastActive: '22 mins ago'
    },
    {
      id: 'USR-9022',
      name: 'Barclays Escrow Trust Node #4',
      email: 'fiduciary@barclays.co.uk',
      role: 'Regulated Escrow Officer',
      did: 'did:trust:0x11bb9420ae456f901188bb34',
      tier: 'Institutional Escrow',
      status: 'ACTIVE',
      lastActive: '1 hour ago'
    },
    {
      id: 'USR-0192',
      name: 'Blacklisted Rogue Notary Sybil #9',
      email: 'suspicious@fake-notary.cc',
      role: 'Flagged Entity',
      did: 'did:trust:0x0000dead0000beef0000cafe',
      tier: 'Revoked Tier 0',
      status: 'REVOKED',
      lastActive: '3 days ago'
    }
  ],

  render: function(container) {
    const stats = AppState.adminStats;

    container.innerHTML = `
      <div class="page-container">
        <!-- View Header -->
        <div class="view-header">
          <div class="view-title-group">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <h1>Platform Operations &amp; Security Consensus</h1>
              <span class="badge badge-verified">Protocol Root Mode</span>
            </div>
            <p>Real-time network telemetry, zero-gas relayer balance, and cryptographic revocation registry.</p>
          </div>
          <div class="view-actions">
            <button class="btn btn-outline-verified btn-sm" onclick="App.showToast('Consensus state 100% synchronized.', 'success')">
              ${Icons.get('repeat', 14)} Sync Health
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.AdminConsoleView.openRevokeModal()">
              ${Icons.get('shield', 14)} Update Revocation List
            </button>
          </div>
        </div>

        <!-- 4 Platform Metric Stats Cards -->
        <div class="admin-stats-grid">
          <div class="metric-card card-highlight">
            <div class="metric-header">
              <span class="metric-title">Verifications Processed</span>
              <div class="metric-icon-wrap">${Icons.get('checkCircle', 18)}</div>
            </div>
            <div class="metric-value">${stats.verificationsProcessed.toLocaleString()}</div>
            <div class="metric-footer">
              <span style="color: var(--verified-emerald);">+12.4% this week</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Properties Registered</span>
              <div class="metric-icon-wrap" style="color: var(--info-blue);">${Icons.get('home', 18)}</div>
            </div>
            <div class="metric-value">${stats.propertiesRegistered.toLocaleString()}</div>
            <div class="metric-footer">
              <span style="color: var(--text-secondary);">Cadastral Subnet</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Transactions Settled</span>
              <div class="metric-icon-wrap" style="color: var(--verified-teal);">${Icons.get('repeat', 18)}</div>
            </div>
            <div class="metric-value">${stats.transactionsCompletedVolume}</div>
            <div class="metric-footer">
              <span style="color: var(--verified-emerald);">Zero Failed Escrows</span>
            </div>
          </div>

          <div class="metric-card" style="border-color: rgba(239, 68, 68, 0.3);">
            <div class="metric-header">
              <span class="metric-title">Fraud Attempts Blocked</span>
              <div class="metric-icon-wrap" style="color: var(--critical-red);">${Icons.get('alertTriangle', 18)}</div>
            </div>
            <div class="metric-value" style="color: var(--critical-red);">${stats.fraudAttemptsBlocked}</div>
            <div class="metric-footer">
              <span style="color: var(--critical-red);">100% Intercepted</span>
            </div>
          </div>
        </div>

        <!-- Network Consensus Nodes Telemetry -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div>
              <div class="card-title">${Icons.get('cpu', 20)} Node Consensus &amp; Gas Relayer Telemetry</div>
              <div class="card-description">Decentralized validator network maintaining SHA-256 block finality</div>
            </div>
            <span class="badge badge-verified">18/18 Nodes Healthy</span>
          </div>

          <div class="node-health-grid">
            <div class="node-card">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Consensus Model</div>
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary); margin-top: 4px;">PBFT-SHA256 Multi-Sig</div>
              <div style="font-size: 11px; color: var(--verified-emerald); margin-top: 2px;">Sub-second Finality (420ms)</div>
            </div>

            <div class="node-card">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Gas-Free Relayer Pool</div>
              <div style="font-weight: 700; font-size: 14px; color: var(--verified-emerald); margin-top: 4px;">${stats.gasRelayerBalance}</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Zero End-User Cost</div>
            </div>

            <div class="node-card">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Uptime SLA</div>
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary); margin-top: 4px;">99.999%</div>
              <div style="font-size: 11px; color: var(--verified-emerald); margin-top: 2px;">0 Ledger Forks Recorded</div>
            </div>

            <div class="node-card">
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Zero-Knowledge Circuit</div>
              <div style="font-weight: 700; font-size: 14px; color: var(--text-primary); margin-top: 4px;">Groth16 SNARKs</div>
              <div style="font-size: 11px; color: var(--info-blue); margin-top: 2px;">Privacy Preserved Identity</div>
            </div>
          </div>
        </div>

        <!-- Credential & User Management Table -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">${Icons.get('user', 20)} Verifiable Credential Registry &amp; Revocation List</div>
              <div class="card-description">Audit and manage active DIDs on the TrustLedger Root Identity Subnet</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-input" placeholder="Filter by DID or name..." style="padding: 4px 10px; font-size: 12px;" />
            </div>
          </div>

          <div style="overflow-x: auto;">
            <table class="audit-table">
              <thead>
                <tr>
                  <th>Identity Holder</th>
                  <th>DID Identifier</th>
                  <th>Verification Tier</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.users.map(u => `
                  <tr>
                    <td>
                      <div style="font-weight: 700; color: var(--text-primary);">${u.name}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${u.email}</div>
                    </td>
                    <td>
                      <span class="mono" style="font-size: 11px;" onclick="App.copyToClipboard('${u.did}')" style="cursor: pointer;">
                        ${u.did.substring(0, 18)}... ${Icons.get('copy', 10)}
                      </span>
                    </td>
                    <td><span class="badge ${u.tier.includes('Tier 3') ? 'badge-verified' : 'badge-neutral'} btn-sm">${u.tier}</span></td>
                    <td>
                      <span class="badge ${u.status === 'ACTIVE' ? 'badge-verified' : 'badge-danger'} btn-sm">
                        ${u.status}
                      </span>
                    </td>
                    <td style="font-size: 12px;">${u.lastActive}</td>
                    <td>
                      ${u.status === 'ACTIVE' ? `
                        <button class="btn btn-danger btn-sm" onclick="window.AdminConsoleView.revokeUser('${u.id}')">
                          Revoke Credential
                        </button>
                      ` : `
                        <span style="font-size: 11px; color: var(--critical-red); font-weight: 700;">Revoked On-Chain</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  revokeUser: function(userId) {
    const u = this.users.find(user => user.id === userId);
    if (!u) return;

    App.showToast(`Publishing cryptographic revocation for ${u.name} to Revocation List 2026...`, 'info');
    setTimeout(() => {
      u.status = 'REVOKED';
      u.tier = 'Revoked Tier 0';
      App.showToast(`Credential for ${u.name} has been revoked!`, 'error');
      this.render(document.getElementById('view-container'));
    }, 900);
  },

  openRevokeModal: function() {
    App.showToast('Revocation registry is currently in sync with all 18 consensus nodes.', 'success');
  }
};
