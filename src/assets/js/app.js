// Dreamy Shots — theme toggle + mobile nav

(function () {
  'use strict';

  // ── Theme toggle ───────────────────────────────────────────────
  var html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-bs-theme', theme);
    try { localStorage.setItem('ds-theme', theme); } catch (e) {}
    var icon = document.getElementById('ds-theme-icon');
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
    }
  }

  var themeToggle = document.getElementById('ds-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = html.getAttribute('data-bs-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
    // Sync icon with current theme set by the anti-FOUC snippet
    var saved = html.getAttribute('data-bs-theme') || 'dark';
    var icon = document.getElementById('ds-theme-icon');
    if (icon) icon.className = saved === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
  }

  // ── Mobile nav toggle ──────────────────────────────────────────
  var navToggle = document.getElementById('ds-nav-toggle');
  var navLinks  = document.getElementById('ds-nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();
