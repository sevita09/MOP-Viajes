// Panel Mis Viajes: estructura y layout (sin funcionalidades)

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

let allCities    = [];
let selectedTrip = null;
let deleteMode   = false;

function confirmDialog(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
      <p class="confirm-message">${message}</p>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-btn-cancel">Cancelar</button>
        <button class="confirm-btn confirm-btn-delete">Eliminar</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    function cleanup(result) {
      overlay.remove();
      dialog.remove();
      resolve(result);
    }

    dialog.querySelector('.confirm-btn-cancel').addEventListener('click', () => cleanup(false));
    dialog.querySelector('.confirm-btn-delete').addEventListener('click', () => cleanup(true));
    overlay.addEventListener('click', () => cleanup(false));

    function onKey(e) {
      if (e.key === 'Escape') { cleanup(false); document.removeEventListener('keydown', onKey); }
      if (e.key === 'Enter')  { cleanup(true);  document.removeEventListener('keydown', onKey); }
    }
    document.addEventListener('keydown', onKey);
  });
}

function setDeleteMode(active) {
  deleteMode = active;
  const panel = document.getElementById('mis-viajes');
  const btn   = document.getElementById('btn-edit');
  if (!panel || !btn) return;
  panel.classList.toggle('delete-mode', active);
  btn.classList.toggle('active', active);
}

function flag(code) {
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  ).join('');
}

function formatDateLabel(startStr, endStr) {
  const s = new Date(startStr + 'T12:00:00');
  const e = new Date(endStr   + 'T12:00:00');
  const sm = MONTHS[s.getMonth()];
  const em = MONTHS[e.getMonth()];
  const sy = s.getFullYear();
  const ey = e.getFullYear();
  if (sy === ey) return `${sm} – ${em} ${sy}`;
  return `${sm} ${sy} – ${em} ${ey}`;
}

function calcDays(startStr, endStr) {
  const s = new Date(startStr + 'T12:00:00');
  const e = new Date(endStr   + 'T12:00:00');
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcKm(trip) {
  const cities = trip.cityIds
    .map(id => allCities.find(c => c.id === id))
    .filter(Boolean);
  let total = 0;
  for (let i = 0; i < cities.length - 1; i++) {
    total += haversine(cities[i].lat, cities[i].lng, cities[i + 1].lat, cities[i + 1].lng);
  }
  return Math.round(total).toLocaleString('es-AR');
}

function getCountryCodes(trip) {
  const codes = trip.cityIds
    .map(id => allCities.find(c => c.id === id))
    .filter(Boolean)
    .map(c => c.countryCode);
  return [...new Set(codes)];
}

function groupByYear(trips) {
  const groups = {};
  trips.forEach(trip => {
    const year = trip.startDate.split('-')[0];
    if (!groups[year]) groups[year] = [];
    groups[year].push(trip);
  });
  return Object.entries(groups).sort((a, b) => b[0] - a[0]);
}

function buildViajesBar() {
  const panel = document.getElementById('mis-viajes');

  panel.innerHTML = `
    <div class="viajesbar-header">
      <div class="viajesbar-header-side"></div>
      <span class="viajesbar-title">Mis viajes</span>
      <div class="viajesbar-actions viajesbar-header-side">
        <button class="viajesbar-btn" id="btn-add" title="Agregar viaje">
          <img src="/static/mis-viajes/icons/plus.svg" width="26" height="26" alt="Agregar" />
        </button>
        <button class="viajesbar-btn" id="btn-edit" title="Editar viajes">
          <img src="/static/mis-viajes/icons/pencil.svg" width="26" height="26" alt="Editar" />
        </button>
      </div>
    </div>
    <div class="viajesbar-list" id="viajesbar-list"></div>
  `;
}

function renderList(trips) {
  const list = document.getElementById('viajesbar-list');
  const groups = groupByYear(trips);

  list.innerHTML = groups.map(([year, yearTrips], i) => `
    <div class="viajesbar-year ${i === 0 ? 'first' : ''}">${year}</div>
    ${yearTrips.map(trip => {
      const countries = getCountryCodes(trip);
      return `
        <div class="viajesbar-card" data-id="${trip.id}">
          <div class="card-actions">
            <button class="card-action-btn card-edit-btn" data-id="${trip.id}" title="Editar viaje">
              <img src="/static/mis-viajes/icons/pencil.svg" width="15" height="15" alt="Editar" />
            </button>
            <button class="card-action-btn card-trash-btn" data-id="${trip.id}" title="Eliminar viaje">🗑</button>
          </div>
          <span class="card-name">${trip.name}</span>
          <span class="card-date">${formatDateLabel(trip.startDate, trip.endDate)}</span>
          <span class="card-days">${calcDays(trip.startDate, trip.endDate)} días  —  ${trip.cityIds.length} ${trip.cityIds.length === 1 ? 'ciudad' : 'ciudades'}  —  ${calcKm(trip)} km</span>
          <div class="card-flags">
            ${countries.map(c => `<span class="card-flag">${flag(c)}</span>`).join('')}
          </div>
        </div>
      `;
    }).join('')}
  `).join('');

  // Click: selecciona / deselecciona (bloqueado en modo eliminación)
  list.querySelectorAll('.viajesbar-card').forEach(card => {
    card.addEventListener('click', e => {
      if (deleteMode) return;
      if (e.target.closest('.card-trash')) return;
      const isSelected = card.classList.contains('selected');
      list.querySelectorAll('.viajesbar-card').forEach(c => c.classList.remove('selected'));
      if (!isSelected) {
        card.classList.add('selected');
        selectedTrip = trips.find(t => t.id === card.dataset.id) || null;
      } else {
        selectedTrip = null;
      }
      document.dispatchEvent(new CustomEvent('trip:selected', { detail: selectedTrip }));
    });
  });

  // Click en papelera: eliminar viaje
  list.querySelectorAll('.card-trash-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!await confirmDialog('¿Eliminás este viaje?')) return;
      const tripId = btn.dataset.id;
      await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (selectedTrip?.id === tripId) selectedTrip = null;
      document.dispatchEvent(new CustomEvent('trips:updated'));
    });
  });

  // Click en lápiz de card: editar viaje
  list.querySelectorAll('.card-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const trip = trips.find(t => t.id === btn.dataset.id);
      if (!trip) return;
      const cities = trip.cityIds
        .map(id => allCities.find(c => c.id === id))
        .filter(Boolean);
      window.openModal('edit', { trip, cities });
    });
  });
}

async function loadData() {
  const [trips, cities] = await Promise.all([
    fetch('/api/trips').then(r => r.json()),
    fetch('/api/cities').then(r => r.json())
  ]);
  allCities    = cities;
  selectedTrip = null;
  setDeleteMode(false);
  renderList(trips);
  document.dispatchEvent(new CustomEvent('trip:selected', { detail: null }));
}

document.addEventListener('DOMContentLoaded', () => {
  buildViajesBar();
  loadData();

  document.addEventListener('click', e => {
    if (!e.target.closest('#btn-edit')) return;
    if (deleteMode) {
      setDeleteMode(false);
      return;
    }
    if (selectedTrip) {
      const cities = selectedTrip.cityIds
        .map(id => allCities.find(c => c.id === id))
        .filter(Boolean);
      window.openModal('edit', { trip: selectedTrip, cities });
      return;
    }
    setDeleteMode(true);
  });
});

document.addEventListener('trips:updated', loadData);

// Deseleccionar al hacer click fuera del mapa y fuera de las cards
document.addEventListener('click', e => {
  if (!selectedTrip) return;
  if (e.target.closest('#mapa')) return;
  if (e.target.closest('.viajesbar-card')) return;
  const list = document.getElementById('viajesbar-list');
  if (list) list.querySelectorAll('.viajesbar-card').forEach(c => c.classList.remove('selected'));
  selectedTrip = null;
  document.dispatchEvent(new CustomEvent('trip:selected', { detail: null }));
});
