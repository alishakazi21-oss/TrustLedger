// View 8: Registrar Web (Municipal Property Registrars & Land Officers)
window.RegistrarWebView = {
  selectedRequestId: 'REQ-REG-771',

  render: function(container) {
    const queue = AppState.registrarQueue;
    const activeReq = queue.find(q => q.id === this.selectedRequestId) || queue[0];

    container.innerHTML = `
      <div class="page-container">
        <!-- View Header -->
        <div class="view-header">
          <div class="view-title-group">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <h1>Cadastral Registrar Review Console</h1>
              <span class="badge badge-warning">Government Authority Mode</span>
            </div>
            <p>Review municipal title registrations, legal surveyor amendments, and execute cryptographic ledger seals.</p>
          </div>
          <div class="view-actions">
            <span class="badge badge-info btn-sm">${queue.length} Pending Approval</span>
            <button class="btn btn-outline-verified btn-sm" onclick="App.showToast('Synchronized with Central HM Land Registry Database.', 'success')">
              ${Icons.get('repeat', 14)} Refresh Queue
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 24px;">
          <!-- Left: Pending Approval Queue List -->
          <div>
            <div class="card">
              <div class="card-header">
                <div>
                  <div class="card-title">${Icons.get('layers', 18)} Incoming Cadastral Queue</div>
                  <div class="card-description">Ordered by priority and submission timestamp</div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${queue.map(item => `
                  <div class="queue-item" style="cursor: pointer; border-left: 3px solid ${item.id === activeReq.id ? 'var(--verified-emerald)' : 'transparent'}; background: ${item.id === activeReq.id ? 'rgba(16, 32, 52, 0.9)' : 'var(--bg-surface-elevated)'};" onclick="window.RegistrarWebView.selectRequest('${item.id}')">
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span class="badge ${item.type.includes('Amendment') ? 'badge-info' : 'badge-verified'} btn-sm" style="font-size: 9px;">${item.type}</span>
                        <span class="mono" style="font-size: 11px;">${item.id}</span>
                      </div>
                      <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">${item.title}</div>
                      <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                        Submitted by: ${item.submittedBy} • ${item.submittedAt}
                      </div>
                    </div>
                    <div>
                      <button class="btn btn-secondary btn-sm" style="font-size: 11px;">Inspect ${Icons.get('arrowRight', 10)}</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right: Document Detail & Side-by-Side Diff Inspector -->
          <div>
            <div class="card card-highlight">
              <div class="card-header">
                <div>
                  <div class="card-title">${Icons.get('fileText', 18)} Cadastral Inspection &amp; Diff</div>
                  <div class="card-description">Request ID: <span class="mono">${activeReq.id}</span> • Property: ${activeReq.propertyId}</div>
                </div>
                <span class="badge badge-warning">${activeReq.status}</span>
              </div>

              <div style="padding: 12px 16px; background: var(--bg-surface-elevated); border-radius: var(--radius-md); font-size: 13px; border: 1px solid var(--glass-border); margin-bottom: 16px;">
                <strong>Proposed Modification:</strong> ${activeReq.changes}
              </div>

              <!-- Side-by-Side Version Diff -->
              <div style="margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">
                  Blockchain Version Comparison (Diff Inspector)
                </div>
                <div class="diff-box">
                  <div class="diff-col old">
                    <div style="font-weight: 700; color: var(--critical-red); margin-bottom: 4px;">Prior Active (v2.1)</div>
                    <div style="color: var(--text-secondary); font-size: 11px;">Block Hash: ${activeReq.priorHash}</div>
                    <div style="margin-top: 8px; font-size: 11px; color: #cbd5e1;">- Pin 4B: 51.49882° N</div>
                    <div style="font-size: 11px; color: #cbd5e1;">- Easement: Standard Residential</div>
                  </div>
                  <div class="diff-col new">
                    <div style="font-weight: 700; color: var(--verified-emerald); margin-bottom: 4px;">Proposed Child (v2.2)</div>
                    <div style="color: var(--text-secondary); font-size: 11px;">Target Hash: ${activeReq.proposedHash}</div>
                    <div style="margin-top: 8px; font-size: 11px; color: #10b981;">+ Pin 4B: 51.49884° N (Aligned)</div>
                    <div style="font-size: 11px; color: #10b981;">+ Solar Offset Recorded</div>
                  </div>
                </div>
              </div>

              <!-- Risk Checklist -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 12px;">
                <div style="padding: 8px 12px; background: rgba(16, 185, 129, 0.08); border-radius: var(--radius-sm); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--verified-emerald);">
                  ✓ Surveyor Digital ECDSA Seal Verified
                </div>
                <div style="padding: 8px 12px; background: rgba(16, 185, 129, 0.08); border-radius: var(--radius-sm); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--verified-emerald);">
                  ✓ Zero Municipal Tax Encumbrances
                </div>
              </div>

              <!-- Registrar Execution Action Buttons -->
              <div style="display: flex; gap: 12px;">
                <button class="btn btn-secondary" style="flex: 1;" onclick="window.RegistrarWebView.rejectRequest('${activeReq.id}')">
                  ${Icons.get('x', 14)} Request Clarification
                </button>
                <button class="btn btn-primary" style="flex: 1;" onclick="window.RegistrarWebView.approveAndSeal('${activeReq.id}')">
                  ${Icons.get('shield', 16)} Sign &amp; Mint Seal (v2.2)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  selectRequest: function(id) {
    this.selectedRequestId = id;
    this.render(document.getElementById('view-container'));
  },

  approveAndSeal: function(id) {
    App.showToast('Affixing Official Government Registrar Seal to Subnet Block...', 'info');
    setTimeout(() => {
      // Remove from pending queue
      AppState.registrarQueue = AppState.registrarQueue.filter(q => q.id !== id);
      App.showToast(`Request ${id} approved! Version v2.2 minted on-chain.`, 'success');
      this.render(document.getElementById('view-container'));
    }, 1000);
  },

  rejectRequest: function(id) {
    App.showToast(`Request ${id} marked for surveyor review.`, 'info');
  }
};
