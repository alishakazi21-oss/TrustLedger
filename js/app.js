// Main Application Bootstrap & UI Utilities
window.App = {
  init: function() {
    this.bindEvents();
    this.updateHeaderProfile();
    window.Router.init();
  },

  bindEvents: function() {
    // Listen for Persona Changes
    window.addEventListener('persona-changed', (e) => {
      this.updateHeaderProfile();
      // Re-render active view if needed
      window.Router.handleRoute();
    });

    // Mobile Sidebar Toggle
    const toggleBtn = document.getElementById('mobile-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Persona Selector in Sidebar
    const personaSelect = document.getElementById('sidebar-persona-select');
    if (personaSelect) {
      personaSelect.addEventListener('change', (e) => {
        AppState.setPersona(e.target.value);
        this.showToast(`Switched active perspective to: ${AppState.getCurrentUser().name}`, 'info');
      });
    }
  },

  updateHeaderProfile: function() {
    const user = AppState.getCurrentUser();
    
    // Topbar Profile
    const avatarEl = document.getElementById('topbar-user-avatar');
    const nameEl = document.getElementById('topbar-user-name');
    const roleEl = document.getElementById('topbar-user-role');
    const pillEl = document.getElementById('topbar-trust-pill');

    if (avatarEl) avatarEl.textContent = user.avatarText;
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.roleTitle;
    if (pillEl) {
      pillEl.innerHTML = `${Icons.get('shield', 14)} <span>${user.kycTier}</span>`;
    }

    // Update Persona Selector in Sidebar
    const personaSelect = document.getElementById('sidebar-persona-select');
    if (personaSelect) {
      personaSelect.value = AppState.currentPersona;
    }
  },

  showToast: function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = Icons.get('checkCircle', 18, 'text-emerald');
    if (type === 'error') icon = Icons.get('alertTriangle', 18, 'text-danger');
    if (type === 'info') icon = Icons.get('shield', 18, 'text-info');

    toast.innerHTML = `
      ${icon}
      <div style="flex: 1; font-size: 13px; font-weight: 500; color: var(--text-primary);">${message}</div>
      <button onclick="this.parentElement.remove()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;">
        ${Icons.get('x', 14)}
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  },

  copyToClipboard: function(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(`Copied to clipboard: ${text.length > 24 ? text.substring(0, 24) + '...' : text}`, 'success');
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  },

  fallbackCopy: function(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.showToast(`Copied to clipboard!`, 'success');
  },

  openModalHtml: function(htmlString) {
    this.closeModal();
    const wrapper = document.createElement('div');
    wrapper.id = 'active-modal-wrapper';
    wrapper.innerHTML = htmlString;
    document.body.appendChild(wrapper);
  },

  closeModal: function() {
    const modal = document.getElementById('active-modal-wrapper');
    if (modal) modal.remove();
  }
};

// Bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
