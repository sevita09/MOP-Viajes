// Modal: agregar y editar viajes

const modalEl    = document.getElementById('modal');
const overlayEl  = document.getElementById('modal-overlay');
const titleEl    = modalEl.querySelector('.modal-title');
const closeBtn   = modalEl.querySelector('.modal-close');
const cancelBtn  = modalEl.querySelector('.modal-btn-cancel');
const saveBtn    = modalEl.querySelector('.modal-btn-save');
const citiesEl   = document.getElementById('modal-cities');
const addCityBtn = document.getElementById('modal-add-city');

const inputName  = document.getElementById('modal-input-name');
const inputStart = document.getElementById('modal-input-start');
const inputEnd   = document.getElementById('modal-input-end');

// ── Utilidades ────────────────────────────────────────────────────

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// ── HTML de fila de ciudad ────────────────────────────────────────

function cityRowHTML() {
  return `
    <div class="modal-city-row">
      <div class="modal-city-input-wrap">
        <input class="modal-input modal-city-input" type="text" placeholder="Buscar ciudad..." />
        <div class="modal-autocomplete hidden"></div>
      </div>
      <button class="modal-city-remove" title="Quitar ciudad">✕</button>
    </div>
  `.trim();
}

// ── Autocomplete ──────────────────────────────────────────────────

async function fetchSuggestions(q) {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    return await res.json();
  } catch {
    return [];
  }
}

function attachAutocompleteListeners(row) {
  const input    = row.querySelector('.modal-city-input');
  const dropdown = row.querySelector('.modal-autocomplete');

  const onInput = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) { dropdown.classList.add('hidden'); return; }

    const suggestions = await fetchSuggestions(q);
    if (!suggestions.length) { dropdown.classList.add('hidden'); return; }

    dropdown.innerHTML = suggestions.map((s, i) => `
      <div class="modal-autocomplete-item" data-idx="${i}">
        <div class="modal-autocomplete-item-city">${s.name}</div>
        <div class="modal-autocomplete-item-country">${s.country}</div>
      </div>
    `).join('');
    dropdown._suggestions = suggestions;

    const rect = input.getBoundingClientRect();
    dropdown.style.top   = `${rect.bottom + 4}px`;
    dropdown.style.left  = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;
    dropdown.classList.remove('hidden');
  }, 300);

  input.addEventListener('input', onInput);

  dropdown.addEventListener('mousedown', e => {
    const item = e.target.closest('.modal-autocomplete-item');
    if (!item) return;
    const city = dropdown._suggestions[parseInt(item.dataset.idx)];
    input.value     = `${city.name}, ${city.country}`;
    input._cityData = city;
    dropdown.classList.add('hidden');
  });

  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.add('hidden'), 150);
  });
}

// ── Filas de ciudades ─────────────────────────────────────────────

function attachCityRowListeners(row) {
  row.querySelector('.modal-city-remove').addEventListener('click', () => {
    if (citiesEl.children.length > 1) row.remove();
  });
}

function addCityRow() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = cityRowHTML();
  const row = wrapper.firstElementChild;
  citiesEl.appendChild(row);
  attachCityRowListeners(row);
  attachAutocompleteListeners(row);
  return row;
}

// ── Formulario ────────────────────────────────────────────────────

function resetForm() {
  inputName.value  = '';
  inputStart.value = '';
  inputEnd.value   = '';
  citiesEl.innerHTML = '';
  addCityRow();
}

// ── Abrir / cerrar ────────────────────────────────────────────────

function openModal(mode = 'add') {
  titleEl.textContent = mode === 'edit' ? 'Editar viaje' : 'Agregar viaje';
  resetForm();
  overlayEl.classList.remove('hidden');
  modalEl.classList.remove('hidden');
  overlayEl.style.display = 'block';
  modalEl.style.display   = 'flex';
  inputName.focus();
}

function closeModal() {
  overlayEl.classList.add('hidden');
  modalEl.classList.add('hidden');
  overlayEl.style.display = '';
  modalEl.style.display   = '';
}

closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
overlayEl.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

addCityBtn.addEventListener('click', () => addCityRow().querySelector('input').focus());

// ── Guardar viaje ─────────────────────────────────────────────────

saveBtn.addEventListener('click', async () => {
  const name      = inputName.value.trim();
  const startDate = inputStart.value;
  const endDate   = inputEnd.value;

  if (!name || !startDate || !endDate) {
    alert('Completá nombre y fechas.');
    return;
  }

  const cityInputs    = Array.from(citiesEl.querySelectorAll('.modal-city-input'));
  const selectedCities = cityInputs.map(i => i._cityData).filter(Boolean);

  if (!selectedCities.length) {
    alert('Seleccioná al menos una ciudad del autocompletado.');
    return;
  }

  saveBtn.disabled    = true;
  saveBtn.textContent = 'Guardando…';

  try {
    const cityIds = [];
    for (const city of selectedCities) {
      const res  = await fetch('/api/cities', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(city),
      });
      const data = await res.json();
      cityIds.push(data.id);
    }

    await fetch('/api/trips', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, startDate, endDate, cityIds }),
    });

    closeModal();
    document.dispatchEvent(new CustomEvent('trips:updated'));
  } catch {
    alert('Hubo un error al guardar. Revisá la consola.');
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Guardar';
  }
});

// ── Expuesto globalmente para modo editar (commit 4) ──────────────
window.openModal = openModal;

// Event delegation: btn-add es creado dinámicamente por mis-viajes.js
document.addEventListener('click', e => {
  if (e.target.closest('#btn-add')) openModal('add');
});
