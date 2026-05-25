// Modal: agregar y editar viajes

const modalEl      = document.getElementById('modal');
const overlayEl    = document.getElementById('modal-overlay');
const titleEl      = modalEl.querySelector('.modal-title');
const closeBtn     = modalEl.querySelector('.modal-close');
const cancelBtn    = modalEl.querySelector('.modal-btn-cancel');
const citiesEl     = document.getElementById('modal-cities');
const addCityBtn   = document.getElementById('modal-add-city');

const inputName    = document.getElementById('modal-input-name');
const inputStart   = document.getElementById('modal-input-start');
const inputEnd     = document.getElementById('modal-input-end');

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
  return row;
}

function resetForm() {
  inputName.value  = '';
  inputStart.value = '';
  inputEnd.value   = '';
  citiesEl.innerHTML = '';
  addCityRow();
}

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

addCityBtn.addEventListener('click', () => {
  const row = addCityRow();
  row.querySelector('input').focus();
});

// Expuesto globalmente para que mis-viajes.js pueda abrirlo en modo editar (commit 4)
window.openModal = openModal;

// Event delegation: btn-add es creado dinámicamente por mis-viajes.js
document.addEventListener('click', e => {
  if (e.target.closest('#btn-add')) openModal('add');
});
