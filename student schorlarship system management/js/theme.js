/** theme.js - Light/dark theme. Loaded in <head> so the theme is applied before the page paints. */
(function (global) {
  'use strict';
  const KEY = 'sms_theme_v1';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function preferred() {
    return stored() || (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function apply(mode) {
    document.documentElement.setAttribute('data-bs-theme', mode);
  }

  const Theme = {
    current() { return document.documentElement.getAttribute('data-bs-theme') || 'light'; },
    set(mode) {
      try { localStorage.setItem(KEY, mode); } catch (e) { /* ignore */ }
      apply(mode);
      global.dispatchEvent(new Event('themechange'));
    },
    toggle() { Theme.set(Theme.current() === 'dark' ? 'light' : 'dark'); }
  };

  apply(preferred());
  global.Theme = Theme;
})(window);
