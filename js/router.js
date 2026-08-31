// Client-Side Hash Router for TrustLedger
window.Router = {
  routes: {
    'landing': { view: window.LandingView, title: 'Welcome to TrustLedger', navKey: null },
    'onboarding': { view: window.OnboardingView, title: 'Digital Identity Setup (e-KYC)', navKey: 'onboarding' },
    'dashboard': { view: window.DashboardView, title: 'Command Hub', navKey: 'dashboard' },
    'verify-doc': { view: window.DocVerificationView, title: 'Document Verification & OCR', navKey: 'verify-doc' },
    'property': { view: window.PropertyRegistryView, title: 'Property Cadastre & Ownership History', navKey: 'property' },
    'transaction': { view: window.TransactionEscrowView, title: 'Smart Escrow & Settlement', navKey: 'transaction' },
    'verifier-app': { view: window.VerifierAppView, title: 'Verifier App & QR Scanner', navKey: 'verifier-app' },
    'registrar-web': { view: window.RegistrarWebView, title: 'Registrar Review Console', navKey: 'registrar-web' },
    'admin-console': { view: window.AdminConsoleView, title: 'Platform Security & Operations', navKey: 'admin-console' }
  },

  currentRoute: 'dashboard',

  init: function() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  navigate: function(routeKey) {
    window.location.hash = routeKey;
  },

  handleRoute: function() {
    let hash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    const route = this.routes[hash] || this.routes['dashboard'];
    this.currentRoute = hash;

    // Toggle Landing Page mode (which hides the sidebar and topbar)
    const appEl = document.getElementById('app');
    if (hash === 'landing') {
      appEl.classList.add('landing-view-active');
    } else {
      appEl.classList.remove('landing-view-active');
    }

    // Update Topbar Breadcrumb & Page Title
    const breadcrumbEl = document.getElementById('current-breadcrumb-title');
    if (breadcrumbEl) breadcrumbEl.textContent = route.title;
    document.title = `TrustLedger — ${route.title}`;

    // Update Sidebar Active Links
    document.querySelectorAll('.nav-item').forEach(el => {
      const target = el.getAttribute('data-route');
      if (target === route.navKey) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Close Mobile Sidebar if Open
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Render View
    const container = document.getElementById('view-container');
    if (container && route.view && typeof route.view.render === 'function') {
      route.view.render(container);
      window.scrollTo(0, 0);
    }
  }
};
