// TrustLedger REST API Client for Frontend
window.TrustLedgerAPI = {
  baseUrl: 'http://localhost:4000',
  token: null,

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('tl_jwt', token);
    } else {
      localStorage.removeItem('tl_jwt');
    }
  },

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('tl_jwt');
    }
    return this.token;
  },

  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status} Error`);
      }
      return data;
    } catch (err) {
      console.warn(`[API] ${options.method || 'GET'} ${endpoint} failed:`, err.message);
      throw err;
    }
  },

  // Health
  async checkHealth() {
    return this.request('/health');
  },

  // Auth
  async login(email, password = 'Demo@1234') {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // Identity
  async onboardIdentity(payload) {
    return this.request('/identity/onboard', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getIdentity(did) {
    return this.request(`/identity/${encodeURIComponent(did)}`);
  },

  // Documents
  async uploadDocument(formData) {
    return this.request('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async getDocumentStatus(id) {
    return this.request(`/documents/${id}`);
  },

  async revokeDocument(id, reason) {
    return this.request(`/documents/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Properties
  async listProperties() {
    return this.request('/properties');
  },

  async getProperty(id) {
    return this.request(`/properties/${id}`);
  },

  async getPropertyHistory(id) {
    return this.request(`/properties/${id}/history`);
  },

  async amendProperty(id, payload) {
    return this.request(`/properties/${id}/amend`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async registerProperty(payload) {
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Transactions
  async listTransactions() {
    return this.request('/transactions');
  },

  async getTransaction(id) {
    return this.request(`/transactions/${id}`);
  },

  async createTransaction(payload) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async fundEscrow(id) {
    return this.request(`/transactions/${id}/fund`, {
      method: 'POST',
    });
  },

  async approveTransaction(id) {
    return this.request(`/transactions/${id}/approve`, {
      method: 'POST',
    });
  },

  async cancelTransaction(id, reason) {
    return this.request(`/transactions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Bundler & AA
  async getBundlerStatus() {
    return this.request('/bundler/status');
  },

  // Admin
  async getAdminStats() {
    return this.request('/admin/stats');
  },

  async getAuditLogs(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/admin/audit-logs${q ? '?' + q : ''}`);
  },

  async listUsers(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/admin/users${q ? '?' + q : ''}`);
  }
};
