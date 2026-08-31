// View 6: Transaction & Escrow Workspace
window.TransactionEscrowView = {
  viewMode: 'buyer', // 'buyer' or 'seller'

  render: function(container) {
    const tx = AppState.activeTransaction;
    const isBuyer = this.viewMode === 'buyer';

    container.innerHTML = `
      <div class="page-container">
        <!-- View Header -->
        <div class="view-header">
          <div class="view-title-group">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <h1>Smart Escrow &amp; Property Conveyance</h1>
              <span class="badge badge-verified">Multi-Sig Escrow Active</span>
            </div>
            <p>Transaction ID: <span class="mono">${tx.txId}</span> • Settlement Asset: Kensington Crescent Estate</p>
          </div>

          <!-- Buyer vs Seller View Toggle -->
          <div class="view-actions">
            <div class="escrow-view-toggle" style="margin-bottom: 0;">
              <button class="toggle-btn ${isBuyer ? 'active' : ''}" onclick="window.TransactionEscrowView.setViewMode('buyer')">
                ${Icons.get('user', 14)} Buyer Perspective
              </button>
              <button class="toggle-btn ${!isBuyer ? 'active' : ''}" onclick="window.TransactionEscrowView.setViewMode('seller')">
                ${Icons.get('user', 14)} Seller Perspective
              </button>
            </div>
          </div>
        </div>

        <!-- 5-Step Connected Workflow Tracker -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div>
              <div class="card-title">${Icons.get('repeat', 20)} Conveyance Lifecycle Progress</div>
              <div class="card-description">Automated smart contract milestones verified by cryptographic notary seals</div>
            </div>
            <span class="badge badge-info btn-sm">Milestone 3 of 5</span>
          </div>

          <div class="escrow-pipeline">
            ${tx.steps.map((st, idx) => `
              <div class="pipeline-step ${st.status === 'completed' ? 'completed' : (st.status === 'in-progress' ? 'active' : '')}">
                <div class="pipeline-step-num">Step 0${idx + 1}</div>
                <div class="pipeline-step-title">${st.name}</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin: 4px 0 8px;">${st.detail}</div>
                <div class="pipeline-status-tag" style="color: ${st.status === 'completed' ? 'var(--verified-emerald)' : (st.status === 'in-progress' ? 'var(--info-blue)' : 'var(--text-muted)')};">
                  ${st.status === 'completed' ? Icons.get('checkCircle', 12) + ' Confirmed' : (st.status === 'in-progress' ? Icons.get('repeat', 12) + ' Processing' : Icons.get('lock', 12) + ' Awaiting')}
                </div>
                <div style="font-size: 10px; color: var(--text-muted); margin-top: auto;">${st.timestamp}</div>
              </div>
            `).join('')}
          </div>

          <!-- Protocol Gasless Sponsor Banner -->
          <div class="sponsor-fee-banner">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${Icons.get('shield', 18)}
              <div>
                <strong>Network Protocol Fee: Sponsored by TrustLedger Relayer ✓</strong>
                <div style="font-size: 12px; color: rgba(255,255,255,0.8); font-weight: 400;">
                  Zero gas or crypto-tokens required. Transactions execute with legal-grade finality.
                </div>
              </div>
            </div>
            <span class="badge badge-verified">Cost: $0.00 USD</span>
          </div>
        </div>

        <!-- Settlement Financials & Multi-Sig Authorization Box -->
        <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px;">
          <!-- Left: Financials & Parties -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">${Icons.get('lock', 18)} Escrow Vault &amp; Counterparty Details</div>
              <span class="badge badge-neutral">Vault #BARC-401</span>
            </div>

            <div class="escrow-breakdown-card" style="margin-bottom: 20px;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Purchase Price</div>
                <div style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">${tx.priceUsd}</div>
                <div style="font-size: 11px; color: var(--verified-emerald);">Agreed On-Chain</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Locked Deposit</div>
                <div style="font-size: 20px; font-weight: 800; color: var(--verified-emerald); margin-top: 4px;">$385,000</div>
                <div style="font-size: 11px; color: var(--text-secondary);">10% in Escrow</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Remaining Balance</div>
                <div style="font-size: 20px; font-weight: 800; color: var(--info-blue); margin-top: 4px;">$3,465,000</div>
                <div style="font-size: 11px; color: var(--text-secondary);">Upon Final Seal</div>
              </div>
            </div>

            <!-- Party Signatures -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                <div>
                  <div style="font-weight: 700; font-size: 13px;">Buyer Signature: ${tx.buyerName}</div>
                  <div class="mono" style="font-size: 11px; color: var(--text-muted);">${tx.buyerDid}</div>
                </div>
                <span class="badge badge-verified btn-sm">${Icons.get('checkCircle', 12)} Signed &amp; Funded</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                <div>
                  <div style="font-weight: 700; font-size: 13px;">Seller Signature: ${tx.sellerName}</div>
                  <div class="mono" style="font-size: 11px; color: var(--text-muted);">${tx.sellerDid}</div>
                </div>
                <span class="badge badge-verified btn-sm">${Icons.get('checkCircle', 12)} Deed v2.1 Staked</span>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                <div>
                  <div style="font-weight: 700; font-size: 13px;">Escrow Fiduciary: ${tx.escrowAgent}</div>
                  <div class="mono" style="font-size: 11px; color: var(--text-muted);">did:trust:0x11bb9420ae456f901188bb34</div>
                </div>
                <span class="badge badge-info btn-sm">${Icons.get('repeat', 12)} Legal Audit Live</span>
              </div>
            </div>
          </div>

          <!-- Right: Role-Specific Action Card -->
          <div class="card card-highlight">
            <div class="card-header">
              <div class="card-title">
                ${isBuyer ? Icons.get('user', 18) + ' Buyer Action Workspace' : Icons.get('home', 18) + ' Seller Action Workspace'}
              </div>
              <span class="badge badge-verified">Single-Click Approval</span>
            </div>

            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
              ${isBuyer ? 
                'You are acting as <strong>Alexander Sterling</strong>. Your $385,000 security deposit is securely locked. Finalize your purchase authorization to execute the smart contract exchange.' :
                'You are acting as <strong>Helena Vance-Croft</strong>. The buyer has deposited the required funds. Release title deed ownership transfer to the escrow smart contract.'
              }
            </div>

            <div style="padding: 16px; background: #03101d; border-radius: var(--radius-md); border: 1px solid var(--glass-border); margin-bottom: 20px;">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 6px;">
                Cryptographic Execution Payload
              </div>
              <div class="mono" style="font-size: 11px; color: var(--verified-emerald); word-break: break-all;">
                ${tx.sha256Proof}
              </div>
            </div>

            <button class="btn btn-primary btn-lg" style="width: 100%; margin-bottom: 12px;" onclick="window.TransactionEscrowView.executeApproval('${isBuyer ? 'buyer' : 'seller'}')">
              ${Icons.get('checkCircle', 20)} ${isBuyer ? 'Authorize & Execute Final Settlement' : 'Authorize Title Deed Release & Settlement'}
            </button>

            <div style="text-align: center; font-size: 12px; color: var(--text-muted);">
              Zero wallet popups • Zero gas fees • Sealed on Cadastral Subnet
            </div>
          </div>
        </div>
      </div>
    `;
  },

  setViewMode: function(mode) {
    this.viewMode = mode;
    this.render(document.getElementById('view-container'));
  },

  executeApproval: function(role) {
    App.showToast(`Signing transaction with ${role.toUpperCase()} decentralized key...`, 'info');
    setTimeout(() => {
      AppState.activeTransaction.currentStep = 4;
      AppState.activeTransaction.steps[2].status = 'completed';
      AppState.activeTransaction.steps[3].status = 'completed';
      AppState.activeTransaction.steps[4].status = 'completed';
      AppState.activeTransaction.steps[4].timestamp = 'Just now (Finalized)';

      App.showToast('Smart Contract Executed & Title Transferred Successfully!', 'success');
      this.render(document.getElementById('view-container'));
    }, 1000);
  }
};
