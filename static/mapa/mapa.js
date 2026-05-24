// Mapa: Leaflet, tiles y leyenda base

const TILES = {
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
};

let map       = null;
let tileLayer = null;

// ── Inicialización ─────────────────────────────────────────────

function initMap(theme) {
  map = L.map('mapa', {
    zoomControl: false,
    attributionControl: false
  }).setView([20, 0], 2);

  tileLayer = L.tileLayer(TILES[theme], { maxZoom: 19 }).addTo(map);

  addLegend();
}

// ── Tema ───────────────────────────────────────────────────────

function applyMapTheme(theme) {
  if (tileLayer) map.removeLayer(tileLayer);
  tileLayer = L.tileLayer(TILES[theme], { maxZoom: 19 }).addTo(map);
}

// ── Leyenda ────────────────────────────────────────────────────

function addLegend() {
  const legend = L.control({ position: 'bottomleft' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'mapa-legend');
    div.innerHTML = `
      <div class="legend-item">
        <span class="legend-country-box"></span>
        <span>País visitado</span>
      </div>
      <div class="legend-item">
        <span class="legend-route-line"></span>
        <span>Ruta</span>
      </div>
    `;
    return div;
  };
  legend.addTo(map);
}

// ── Eventos ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('mop_theme') || 'dark';
  initMap(theme);

  document.addEventListener('themechange', e => applyMapTheme(e.detail.theme));
});
