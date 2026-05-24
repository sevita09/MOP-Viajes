const THEME_KEY = 'mop_theme';
const GITHUB_URL = 'https://github.com/sevita09/MOP-Viajes';

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTopbarTheme(theme) {
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(theme);
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

function buildTopbar() {
  const topbar = document.getElementById('topbar');

  topbar.innerHTML = `
    <img src="/static/logo.png" alt="Logo" class="topbar-logo" />
    <span class="topbar-title">MOP Viajes</span>
    <div class="topbar-spacer"></div>
    <a href="${GITHUB_URL}" target="_blank" rel="noopener" class="topbar-icon-btn" title="Ver en GitHub">
      <img src="/static/topbar/icons/github.svg" width="28" height="28" alt="GitHub" />
    </a>
    <div class="topbar-divider"></div>
    <button class="topbar-icon-btn" id="theme-toggle" title="Cambiar tema"></button>
  `;

  updateThemeIcon(getTheme());

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTopbarTheme(next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const icon = theme === 'dark' ? 'moon' : 'sun';
  const size = icon === 'moon' ? 34 : 28;
  btn.innerHTML = `<img src="/static/topbar/icons/${icon}.svg" width="${size}" height="${size}" alt="${icon}" />`;
}

document.addEventListener('DOMContentLoaded', () => {
  applyTopbarTheme(getTheme());
  buildTopbar();
});
