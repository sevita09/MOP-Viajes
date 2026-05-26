// Stats bar: cards globales y por viaje seleccionado

let statsTrips  = [];
let statsCities = [];

const STAT_CARDS = [
  { key: 'paises',   label: 'Países',        labelTrip: 'Países'        },
  { key: 'ciudades', label: 'Ciudades',       labelTrip: 'Ciudades'      },
  { key: 'viajes',   label: 'Viajes',         labelTrip: 'Días'          },
  { key: 'km',       label: 'Km recorridos',  labelTrip: 'Km recorridos' }
];

// ── Formato de números ─────────────────────────────────────────

function formatNum(n) {
  return n.toLocaleString('es-AR');
}

function numFontSize(str) {
  return str.length > 6 ? '36px' : '48px';
}

// ── Cálculo de stats ───────────────────────────────────────────

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

function calcTripStats(trip) {
  const cities  = trip.cityIds.map(id => statsCities.find(c => c.id === id)).filter(Boolean);
  const paises  = new Set(cities.map(c => c.countryCode)).size;
  const ciudades = cities.length;

  const s = new Date(trip.startDate + 'T12:00:00');
  const e = new Date(trip.endDate   + 'T12:00:00');
  const viajes = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1; // días

  let km = 0;
  for (let i = 0; i < cities.length - 1; i++) {
    km += haversine(cities[i].lat, cities[i].lng, cities[i+1].lat, cities[i+1].lng);
  }

  return { paises, ciudades, viajes, km: Math.round(km) };
}

// ── Render ─────────────────────────────────────────────────────

function buildStatsBar() {
  const bar = document.getElementById('statsbar');
  bar.innerHTML = STAT_CARDS.map(card => `
    <div class="stat-card" data-key="${card.key}">
      <span class="stat-value" data-key="${card.key}">—</span>
      <span class="stat-label" data-key="${card.key}">${card.label}</span>
    </div>
  `).join('');
}

function renderStats(stats, tripMode = false) {
  STAT_CARDS.forEach(card => {
    const raw      = stats[card.key];
    const str      = formatNum(raw);
    const valEl    = document.querySelector(`.stat-value[data-key="${card.key}"]`);
    const labelEl  = document.querySelector(`.stat-label[data-key="${card.key}"]`);
    if (!valEl || !labelEl) return;
    valEl.textContent    = str;
    valEl.style.fontSize = numFontSize(str);
    labelEl.textContent  = tripMode ? card.labelTrip : card.label;
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

document.addEventListener('trip:selected', e => {
  const trip = e.detail;
  if (trip) {
    renderStats(calcTripStats(trip), true);
  } else {
    renderStats(calcGlobalStats(), false);
  }
});
