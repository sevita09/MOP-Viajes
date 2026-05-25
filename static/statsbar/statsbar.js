// Stats bar: cards globales

let statsTrips  = [];
let statsCities = [];

const STAT_CARDS = [
  { key: 'paises',   label: 'Países'         },
  { key: 'ciudades', label: 'Ciudades'        },
  { key: 'viajes',   label: 'Viajes'          },
  { key: 'km',       label: 'Km recorridos'   }
];

// ── Formato de números ─────────────────────────────────────────

function formatNum(n) {
  return n.toLocaleString('es-AR');
}

function numFontSize(str) {
  return str.length > 6 ? '36px' : '48px';
}

// ── Cálculo de stats globales ──────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcGlobalStats() {
  const allCityIds  = [...new Set(statsTrips.flatMap(t => t.cityIds))];
  const allCities   = allCityIds.map(id => statsCities.find(c => c.id === id)).filter(Boolean);
  const paises      = new Set(allCities.map(c => c.countryCode)).size;
  const ciudades    = allCityIds.length;
  const viajes      = statsTrips.length;

  let km = 0;
  statsTrips.forEach(trip => {
    const cities = trip.cityIds.map(id => statsCities.find(c => c.id === id)).filter(Boolean);
    for (let i = 0; i < cities.length - 1; i++) {
      km += haversine(cities[i].lat, cities[i].lng, cities[i+1].lat, cities[i+1].lng);
    }
  });

  return { paises, ciudades, viajes, km: Math.round(km) };
}

// ── Render ─────────────────────────────────────────────────────

function buildStatsBar() {
  const bar = document.getElementById('statsbar');
  bar.innerHTML = STAT_CARDS.map(card => `
    <div class="stat-card" data-key="${card.key}">
      <span class="stat-value" data-key="${card.key}">—</span>
      <span class="stat-label">${card.label}</span>
    </div>
  `).join('');
}

function renderStats(stats) {
  STAT_CARDS.forEach(card => {
    const raw = stats[card.key];
    const str = formatNum(raw);
    const el  = document.querySelector(`.stat-value[data-key="${card.key}"]`);
    if (!el) return;
    el.textContent    = str;
    el.style.fontSize = numFontSize(str);
  });
}

// ── Init ───────────────────────────────────────────────────────

async function loadStatsData() {
  const [trips, cities] = await Promise.all([
    fetch('/api/trips').then(r => r.json()),
    fetch('/api/cities').then(r => r.json())
  ]);
  statsTrips  = trips;
  statsCities = cities;
  renderStats(calcGlobalStats());
}

document.addEventListener('DOMContentLoaded', () => {
  buildStatsBar();
  loadStatsData();
});

document.addEventListener('trips:updated', loadStatsData);
