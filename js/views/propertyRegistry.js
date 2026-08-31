// View 5: Property Registry & Ownership History (Immutable Cadastre)
window.PropertyRegistryView = {
  selectedPropertyId: 'TL-PROP-9821',

  render: function(container) {
    const prop = AppState.properties.find(p => p.id === this.selectedPropertyId) || AppState.properties[0];

    container.innerHTML = `
      <div class="page-container">
        <!-- View Header -->
        <div class="view-header">
          <div class="view-title-group">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <h1>${prop.title}</h1>
              <span class="badge badge-verified">Cadastre Verified</span>
            </div>
            <p>${prop.address} • Parcel ID: <span class="mono">${prop.parcelId}</span></p>
          </div>
          <div class="view-actions">
            <!-- Property Selector Dropdown -->
            <select class="form-select" onchange="window.PropertyRegistryView.switchProperty(this.value)" style="padding: 6px 12px; font-size: 13px;">
              ${AppState.properties.map(p => `
                <option value="${p.id}" ${p.id === prop.id ? 'selected' : ''}>${p.title} (${p.id})</option>
              `).join('')}
            </select>

            <button class="btn btn-secondary btn-sm" onclick="window.PropertyRegistryView.openAmendmentModal('${prop.id}')">
              ${Icons.get('fileText', 14)} Propose Cadastral Amendment
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.Router.navigate('transaction')">
              ${Icons.get('repeat', 14)} Initiate Escrow Transfer
            </button>
          </div>
        </div>

        <div class="property-details-grid">
          <!-- Left Column: Attributes, Map & Risk Badge -->
          <div>
            <!-- Risk & Encumbrance Status Card -->
            <div class="card" style="margin-bottom: 24px;">
              <div class="card-header">
                <div>
                  <div class="card-title">${Icons.get('shield', 20)} Legal &amp; Encumbrance Risk Assessment</div>
                  <div class="card-description">Automated on-chain lien query &amp; litigation clearance check</div>
                </div>
                <div class="risk-meter ${prop.riskStatus.toLowerCase()}">
                  ${Icons.get('checkCircle', 14)} ${prop.riskStatus} Risk Level (${prop.riskScore})
                </div>
              </div>

              <div style="padding: 12px 16px; background: var(--bg-surface-elevated); border-radius: var(--radius-md); font-size: 13px; color: var(--text-secondary); border: 1px solid var(--glass-border);">
                <strong style="color: var(--verified-emerald);">Diagnostic Summary:</strong> ${prop.riskDetails}
              </div>

              <!-- Property Attribute Grid -->
              <div class="property-attribute-list">
                <div class="attr-box">
                  <div class="attr-box-label">Zoning Classification</div>
                  <div class="attr-box-value">${prop.zoning}</div>
                </div>
                <div class="attr-box">
                  <div class="attr-box-label">Gross Land &amp; Living Area</div>
                  <div class="attr-box-value">${prop.sqFt}</div>
                </div>
                <div class="attr-box">
                  <div class="attr-box-label">Cadastral GPS Coordinates</div>
                  <div class="attr-box-value mono" style="font-size: 12px;">${prop.cadastralCoordinates}</div>
                </div>
                <div class="attr-box">
                  <div class="attr-box-label">Independent Cadastre Valuation</div>
                  <div class="attr-box-value" style="color: var(--verified-emerald);">${prop.estimatedValue}</div>
                </div>
              </div>
            </div>

            <!-- Interactive Geo-Fence Parcel Boundary Map -->
            <div class="card" style="margin-bottom: 24px;">
              <div class="card-header">
                <div>
                  <div class="card-title">${Icons.get('globe', 20)} Georeferenced Cadastre Boundary</div>
                  <div class="card-description">Cryptographically pinned satellite boundary survey coordinates</div>
                </div>
                <span class="badge badge-info btn-sm">Polygon Geofenced</span>
              </div>

              <div class="property-map-container">
                <!-- Interactive SVG Map -->
                <svg class="map-svg-canvas" viewBox="0 0 600 280">
                  <!-- Grid Pattern Background -->
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148, 163, 184, 0.08)" stroke-width="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  <!-- Surrounding Parcel Lines (Faint) -->
                  <polygon points="50,40 180,30 220,120 70,140" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(148, 163, 184, 0.2)" stroke-width="1.5" />
                  <text x="100" y="85" fill="#64748b" font-size="10" font-family="Inter">Parcel #9820</text>

                  <polygon points="400,60 550,50 560,190 410,180" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(148, 163, 184, 0.2)" stroke-width="1.5" />
                  <text x="450" y="110" fill="#64748b" font-size="10" font-family="Inter">Parcel #9822</text>

                  <!-- Target Property Parcel Boundary (Highlighted Emerald) -->
                  <polygon points="200,60 380,45 395,220 225,235 190,160" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2.5" />

                  <!-- Boundary Survey Pin Markers -->
                  <circle cx="200" cy="60" r="5" fill="#10b981" />
                  <circle cx="380" cy="45" r="5" fill="#10b981" />
                  <circle cx="395" cy="220" r="5" fill="#10b981" />
                  <circle cx="225" cy="235" r="5" fill="#10b981" />
                  <circle cx="190" cy="160" r="5" fill="#10b981" />

                  <!-- Property Label in Center -->
                  <rect x="235" y="125" width="130" height="36" rx="6" fill="rgba(3, 20, 39, 0.9)" stroke="#10b981" stroke-width="1"/>
                  <text x="300" y="142" fill="#f8fafc" font-size="11" font-weight="700" text-anchor="middle" font-family="Inter">${prop.id}</text>
                  <text x="300" y="154" fill="#10b981" font-size="9" font-weight="600" text-anchor="middle" font-family="Inter">0.32 Acres • Verified</text>
                </svg>

                <div class="map-overlay-controls">
                  <span>GPS: ${prop.cadastralCoordinates}</span>
                  <span style="color: var(--verified-emerald);">● Layer: Live Cadastre</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Ownership History Version Timeline (Original -> Superseded -> Current) -->
          <div>
            <div class="card">
              <div class="card-header">
                <div>
                  <div class="card-title">${Icons.get('layers', 20)} Immutable Ownership Timeline</div>
                  <div class="card-description">Historical versions are superseded on-chain, never deleted.</div>
                </div>
                <span class="badge badge-verified">SHA-256 Chained</span>
              </div>

              <!-- Versioning Timeline -->
              <div class="timeline-versioning">
                ${prop.history.map(item => `
                  <div class="timeline-node ${item.isSuperseded ? 'superseded' : 'current'}">
                    <div class="timeline-marker">
                      ${item.isSuperseded ? Icons.get('layers', 12) : Icons.get('checkCircle', 14)}
                    </div>
                    <div class="timeline-card">
                      <div class="timeline-card-header">
                        <div>
                          <span class="version-tag ${item.isSuperseded ? 'superseded' : 'current'}">${item.version}</span>
                          <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">${item.date}</span>
                        </div>
                        <span class="badge ${item.isSuperseded ? 'badge-neutral' : 'badge-verified'} btn-sm" style="font-size: 10px;">
                          ${item.isSuperseded ? 'Superseded by v2.1' : 'Current Active Title'}
                        </span>
                      </div>

                      <div style="font-weight: 700; font-size: 13px; color: var(--text-primary); margin-bottom: 4px;">
                        ${item.event}
                      </div>

                      <div style="font-size: 12px; color: var(--text-secondary);">
                        ${item.parties}
                      </div>

                      <div class="timeline-meta-row">
                        <span class="block-hash-pill">${item.blockNumber}</span>
                        <span class="block-hash-pill" onclick="App.copyToClipboard('${item.blockHash}')" style="cursor: pointer;">
                          ${item.blockHash} ${Icons.get('copy', 10)}
                        </span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 11px; color: var(--text-muted);">
                  Root Block Genesis Hash: <span class="mono">0x181048...f9021</span>
                </div>
                <button class="btn btn-outline-verified btn-sm" onclick="window.PropertyRegistryView.openAmendmentModal('${prop.id}')">
                  ${Icons.get('fileText', 14)} Create Amendment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  switchProperty: function(propId) {
    this.selectedPropertyId = propId;
    this.render(document.getElementById('view-container'));
  },

  openAmendmentModal: function(propId) {
    const prop = AppState.properties.find(p => p.id === propId) || AppState.properties[0];
    const modalHtml = `
      <div class="modal-backdrop" id="amend-modal" onclick="if(event.target.id==='amend-modal') App.closeModal()">
        <div class="modal-content" style="max-width: 600px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h3>Propose Cadastral Amendment</h3>
              <div style="font-size: 12px; color: var(--text-secondary);">Creating New Child Version (v2.2) for ${prop.title}</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="App.closeModal()">${Icons.get('x', 16)}</button>
          </div>

          <div style="padding: 12px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); font-size: 12px; color: var(--warning-amber); margin-bottom: 16px;">
            <strong>Immutability Notice:</strong> This action does NOT modify historical entries. It mints version <code>v2.2</code> and supersedes <code>v2.1</code> upon municipal registrar signature.
          </div>

          <form onsubmit="window.PropertyRegistryView.submitAmendment(event, '${prop.id}')">
            <div class="form-group">
              <label class="form-label">Amendment Classification</label>
              <select class="form-select" id="amend-type">
                <option>Cadastral Boundary / Geofence Coordinate Adjustment</option>
                <option>Easement / Solar Rights Recording</option>
                <option>Building Expansion Legal Deed Correction</option>
                <option>Encumbrance Clearance / Mortgage Release</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Justification &amp; Survey Reference</label>
              <textarea class="form-textarea" rows="3" placeholder="Provide legal rationale, surveyor license number, and municipal ordinance reference..." required>Surveyor License #GB-401: Revised southeast boundary polygon to conform with official 2026 city roadway expansion.</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Supporting Surveyor Seal Document</label>
              <input type="file" class="form-input" style="padding: 6px;" />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                ${Icons.get('checkCircle', 16)} Submit to Registrar Queue
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    App.openModalHtml(modalHtml);
  },

  submitAmendment: function(e, propId) {
    if (e) e.preventDefault();
    App.closeModal();
    App.showToast('Amendment submitted to Registrar Web approval queue!', 'success');
    window.Router.navigate('registrar-web');
  }
};
