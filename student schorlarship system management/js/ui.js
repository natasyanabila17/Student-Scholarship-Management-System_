/**
 * ui.js - Reusable UI helpers: navbar, footer, theme toggle, toast, confirm dialog,
 * badges, escaping and formatting. Every page uses these instead of repeating markup.
 */
(function (global) {
  'use strict';

  const NAV_STAFF = [
    { id: 'dashboard',    href: 'dashboard.html',    label: 'Dashboard',    icon: 'bi-speedometer2' },
    { id: 'applicants',   href: 'applicants.html',   label: 'Applicants',   icon: 'bi-people' },
    { id: 'scholarships', href: 'scholarships.html', label: 'Scholarships', icon: 'bi-award' }
  ];
  const NAV_STUDENT = [
    { id: 'scholarships',    href: 'scholarships.html',    label: 'Scholarships',    icon: 'bi-award' },
    { id: 'my-applications', href: 'my-applications.html', label: 'My Applications', icon: 'bi-journal-check' }
  ];

  /** Escape user-controlled text before inserting into HTML (prevents XSS). */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const money = n => 'RM ' + Number(n).toLocaleString('en-MY');

  const formatDate = iso => {
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? esc(iso) : d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /** "5 min ago", "3 d ago", or a date for anything older than a week. */
  function timeAgo(iso) {
    const d = new Date(iso);
    const s = (Date.now() - d.getTime()) / 1000;
    if (isNaN(s)) return '';
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    if (s < 604800) return Math.floor(s / 86400) + ' d ago';
    return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const badge = status => {
    const map = { Approved: 'success', Pending: 'warning', Rejected: 'danger' };
    const icon = { Approved: 'bi-check-circle', Pending: 'bi-hourglass-split', Rejected: 'bi-x-circle' };
    return `<span class="badge text-bg-${map[status] || 'secondary'}"><i class="bi ${icon[status] || 'bi-dot'} me-1" aria-hidden="true"></i>${esc(status)}</span>`;
  };

  const roleClass = role => role === 'Administrator' ? 'role-admin' : role === 'Student' ? 'role-student' : 'role-officer';

  const emptyState = (icon, title, text) => `
    <div class="empty-state"><i class="bi ${icon}" aria-hidden="true"></i>
    <h3 class="h6">${esc(title)}</h3><p class="small mb-0">${esc(text)}</p></div>`;

  /* ---------- Theme toggle ---------- */
  function syncThemeButtons() {
    const dark = global.Theme.current() === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(b => {
      b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      b.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme');
      b.innerHTML = `<i class="bi ${dark ? 'bi-sun' : 'bi-moon-stars'}" aria-hidden="true"></i>`;
    });
  }

  function bindThemeToggle() {
    document.addEventListener('click', e => {
      if (e.target.closest('[data-theme-toggle]')) global.Theme.toggle();
    });
    global.addEventListener('themechange', syncThemeButtons);
    syncThemeButtons();
  }

  /** Renders navbar + footer into #app-nav and #app-footer. The menu depends on the role. */
  function renderShell(activeId) {
    const user = global.Auth.current();
    const isAdmin = global.Auth.isAdmin();
    const NAV = global.Auth.isStudent() ? NAV_STUDENT : NAV_STAFF;

    const links = NAV.map(n => `
      <li class="nav-item">
        <a class="nav-link ${n.id === activeId ? 'active' : ''}" href="${n.href}" ${n.id === activeId ? 'aria-current="page"' : ''}>
          <i class="bi ${n.icon} me-1" aria-hidden="true"></i>${n.label}
        </a>
      </li>`).join('');

    const nav = document.getElementById('app-nav');
    if (nav) nav.innerHTML = `
      <nav class="navbar navbar-expand-lg app-navbar sticky-top shadow-sm" data-bs-theme="dark" aria-label="Main navigation">
        <div class="container">
          <a class="navbar-brand navbar-brand-text" href="${global.Auth.home()}"><i class="bi bi-mortarboard-fill text-warning me-2" aria-hidden="true"></i>ScholarMS</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
                  aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
          <div class="collapse navbar-collapse" id="mainNav">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">${links}</ul>
            <div class="d-flex align-items-center gap-2 pb-2 pb-lg-0">
              <button class="btn btn-sm btn-outline-light" type="button" data-theme-toggle></button>
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="bi bi-person-circle me-1" aria-hidden="true"></i>${esc(user ? user.fullName : 'Guest')}
                </button>
                <ul class="dropdown-menu dropdown-menu-end" data-bs-theme="${global.Theme.current()}">
                  <li><span class="dropdown-item-text small"><span class="role-pill ${roleClass(user && user.role)}">${esc(user ? user.role : '')}</span></span></li>
                  <li><hr class="dropdown-divider"></li>
                  ${isAdmin ? '<li><button class="dropdown-item" type="button" id="resetBtn"><i class="bi bi-arrow-repeat me-2" aria-hidden="true"></i>Reset demo data</button></li>' : ''}
                  <li><button class="dropdown-item" type="button" id="logoutBtn"><i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Logout</button></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>`;

    const footer = document.getElementById('app-footer');
    if (footer) footer.innerHTML = `
      <footer class="app-footer pt-4 pb-3" role="contentinfo">
        <div class="container">
          <div class="row gy-3">
            <div class="col-md-5">
              <h2 class="h6 text-white"><i class="bi bi-mortarboard-fill text-warning me-2" aria-hidden="true"></i>Student Scholarship Management System</h2>
              <p class="small mb-0">Managing scholarship applications, quotas and funding. Built for IMS566.</p>
            </div>
            <div class="col-6 col-md-3">
              <h2 class="h6 text-white">Quick links</h2>
              <ul class="list-unstyled small mb-0">
                ${NAV.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}
              </ul>
            </div>
            <div class="col-6 col-md-4">
              <h2 class="h6 text-white">Contact</h2>
              <address class="small mb-0">
                Scholarship Office<br>
                <a href="mailto:scholarship@example.edu.my">scholarship@example.edu.my</a>
              </address>
            </div>
          </div>
          <hr class="border-secondary my-3">
          <p class="small text-center mb-0">&copy; ${new Date().getFullYear()} ScholarMS &middot; Natasya Nabila &middot; IMS566 Individual Assignment</p>
        </div>
      </footer>`;

    const out = document.getElementById('logoutBtn');
    if (out) out.addEventListener('click', global.Auth.logout);

    const reset = document.getElementById('resetBtn');
    if (reset) reset.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Reset demo data?',
        body: 'All applications and the activity log return to the original sample data. User accounts are kept.',
        okText: 'Reset data', okClass: 'btn-danger'
      });
      if (!ok) return;
      try { await global.SMS.Api.resetDemo(); window.location.reload(); }
      catch (err) { toast(err.message, 'danger'); }
    });

    bindThemeToggle();
  }

  /** Accessible toast notification. */
  function toast(message, type) {
    type = type || 'success';
    let box = document.getElementById('toastBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastBox';
      box.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${type} border-0`;
    el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${esc(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
    box.appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 3500 });
    el.addEventListener('hidden.bs.toast', () => el.remove());
    t.show();
  }

  /** Promise-based confirm dialog (replaces the ugly window.confirm). Resolves true / false. */
  function confirmDialog(opts) {
    return new Promise(resolve => {
      const old = document.getElementById('confirmModal');
      if (old) old.remove();
      const el = document.createElement('div');
      el.className = 'modal fade';
      el.id = 'confirmModal';
      el.tabIndex = -1;
      el.setAttribute('aria-labelledby', 'confirmTitle');
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `
        <div class="modal-dialog modal-dialog-centered"><div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" id="confirmTitle">${esc(opts.title)}</h2>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">${esc(opts.body)}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn ${opts.okClass || 'btn-danger'}" id="confirmOk">${esc(opts.okText || 'Confirm')}</button>
          </div>
        </div></div>`;
      document.body.appendChild(el);
      const modal = new bootstrap.Modal(el);
      let result = false;
      el.querySelector('#confirmOk').addEventListener('click', () => { result = true; modal.hide(); });
      el.addEventListener('hidden.bs.modal', () => { el.remove(); resolve(result); });
      modal.show();
    });
  }

  function showError(msg) {
    const box = document.getElementById('errorBox');
    if (!box) return;
    box.innerHTML = `<i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>${esc(msg)}
      <button class="btn btn-sm btn-outline-danger ms-3" type="button" onclick="location.reload()">Retry</button>`;
    box.classList.remove('d-none');
  }

  global.UI = { esc, money, formatDate, timeAgo, badge, roleClass, emptyState, renderShell, bindThemeToggle, toast, confirm: confirmDialog, showError };
})(window);
