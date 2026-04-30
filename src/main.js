import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import outputs from '../amplify_outputs.json';
import './styles.css';

const STORAGE_KEY = 'paseocan-state-v2';

const demoData = {
  owners: [
    {
      id: 'owner-ana',
      name: 'Ana Rodríguez',
      phone: '8888-0101',
      email: 'ana@example.com',
      zone: 'Barrio Escalante',
      address: 'Cerca del Parque Francia',
      notes: 'Prefiere paseos por la tarde.',
    },
    {
      id: 'owner-carlos',
      name: 'Carlos Mora',
      phone: '8888-0202',
      email: 'carlos@example.com',
      zone: 'Rohrmoser',
      address: 'Zona La Sabana',
      notes: 'Disponible para recibir al paseador en la mañana.',
    },
  ],
  dogs: [
    {
      id: 'dog-luna',
      ownerId: 'owner-ana',
      name: 'Luna',
      breed: 'Golden mix',
      age: 4,
      size: 'Mediano',
      energy: 'Activa',
      notes: 'Ama parques y trota suave.',
    },
    {
      id: 'dog-max',
      ownerId: 'owner-carlos',
      name: 'Max',
      breed: 'Frenchie',
      age: 2,
      size: 'Pequeño',
      energy: 'Tranquilo',
      notes: 'Paseos cortos con sombra.',
    },
  ],
  walkers: [
    {
      id: 'walker-sofia',
      name: 'Sofía Mora',
      phone: '8777-0101',
      email: 'sofia@example.com',
      zone: 'San José Centro',
      rate: 120,
      rating: 4.9,
      distance: '0.8 km',
      tags: ['Perros grandes', 'Entrenamiento'],
      availability: 'Hoy',
      status: 'Disponible',
      notes: 'Experiencia con perros activos.',
    },
    {
      id: 'walker-diego',
      name: 'Diego Arias',
      phone: '8777-0202',
      email: 'diego@example.com',
      zone: 'Escalante / Dent',
      rate: 105,
      rating: 4.8,
      distance: '1.2 km',
      tags: ['Perros pequeños', 'Medicación'],
      availability: 'Mañana',
      status: 'Disponible',
      notes: 'Ideal para perros pequeños o adultos.',
    },
  ],
  walks: [
    {
      id: 'walk-1',
      ownerId: 'owner-ana',
      dogId: 'dog-luna',
      walkerId: 'walker-sofia',
      date: getLocalDateISO(),
      time: '16:30',
      duration: 45,
      route: 'Parque Francia',
      status: 'Confirmado',
      estimatedCost: 6050,
      notes: 'Correa roja.',
    },
    {
      id: 'walk-2',
      ownerId: 'owner-carlos',
      dogId: 'dog-max',
      walkerId: 'walker-diego',
      date: getLocalDateISO(),
      time: '09:10',
      duration: 30,
      route: 'Barrio Escalante',
      status: 'Pendiente',
      estimatedCost: 3800,
      notes: 'Evitar calor fuerte.',
    },
  ],
};

const state = {
  mode: 'owner',
  backend: 'local',
  client: null,
  selectedOwnerId: '',
  selectedDogId: '',
  selectedWalkerId: '',
  owners: [],
  dogs: [],
  walkers: [],
  walks: [],
};

const els = {};

document.addEventListener('DOMContentLoaded', async () => {
  renderShell();
  bindElements();
  bindEvents();
  await initDataLayer();
  await loadData();
  renderAll();
});

function renderShell() {
  document.querySelector('#app').innerHTML = `
    <header class="site-header">
      <nav class="nav-shell" aria-label="Navegación principal">
        <a href="#inicio" class="brand">
          <span class="brand-mark">PC</span>
          <span>
            <strong>PaseoCan</strong>
            <small>Gestión de paseos</small>
          </span>
        </a>
        <div class="nav-links">
          <a href="#agenda">Agenda</a>
          <a href="#registros">Registros</a>
          <a href="#paseadores">Paseadores</a>
          <a href="#admin">Panel</a>
        </div>
      </nav>
    </header>

    <main>
      <section id="inicio" class="hero section-grid">
        <div class="hero-copy">
          <span class="eyebrow">San José, Costa Rica</span>
          <h1>Paseos listos para hoy</h1>
          <p>Registrá dueños, perros, paseadores y reservas desde una sola pantalla. Cuando Amplify esté configurado, los datos se guardan en DynamoDB.</p>
          <div class="hero-actions">
            <button class="primary-btn" id="jumpDogRegistration" type="button">Registrar perro</button>
            <button class="secondary-btn" id="jumpBooking" type="button">Reservar paseo</button>
          </div>
        </div>
        <aside class="status-card">
          <div>
            <span class="eyebrow">Estado de datos</span>
            <h2 id="dataStatusTitle">Preparando conexión</h2>
            <p id="dataStatusDescription">Validando si Amplify ya está configurado.</p>
          </div>
          <button class="secondary-btn compact" id="seedButton" type="button">Cargar datos demo</button>
        </aside>
      </section>

      <section class="metrics-grid" aria-label="Resumen operativo">
        <article class="metric-card">
          <span>Dueños</span>
          <strong id="ownerCount">0</strong>
          <small>Registrados</small>
        </article>
        <article class="metric-card">
          <span>Perros</span>
          <strong id="dogCount">0</strong>
          <small>Perfiles activos</small>
        </article>
        <article class="metric-card">
          <span>Paseadores</span>
          <strong id="walkerCount">0</strong>
          <small>Disponibles</small>
        </article>
        <article class="metric-card accent">
          <span>Paseos</span>
          <strong id="walkCount">0</strong>
          <small>En agenda</small>
        </article>
      </section>

      <section id="agenda" class="section-grid booking-section">
        <div class="panel booking-panel">
          <div class="section-heading">
            <span class="eyebrow">Reserva</span>
            <h2>Nuevo paseo</h2>
          </div>
          <form id="bookingForm" class="form-grid">
            <label>
              Perro
              <select id="walkDog" required></select>
            </label>
            <label>
              Dueño
              <select id="walkOwner" required></select>
            </label>
            <label>
              Paseador
              <select id="walkWalker" required></select>
            </label>
            <label>
              Fecha
              <input id="walkDate" type="date" required />
            </label>
            <label>
              Hora
              <input id="walkTime" type="time" required />
            </label>
            <label>
              Duración
              <select id="walkDuration" required>
                <option value="30">30 min</option>
                <option value="45" selected>45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </label>
            <label>
              Ruta
              <select id="walkRoute" required>
                <option>Parque Francia</option>
                <option>Barrio Escalante</option>
                <option>La Sabana</option>
                <option>Rohrmoser</option>
                <option>Ruta personalizada</option>
              </select>
            </label>
            <label class="full-span">
              Notas
              <textarea id="walkNotes" rows="3" placeholder="Indicaciones para el paseador, comportamiento, medicación, correa, etc."></textarea>
            </label>
            <div class="form-footer full-span">
              <div>
                <span class="eyebrow">Total estimado</span>
                <strong id="estimateTotal">CRC 0</strong>
              </div>
              <button class="primary-btn" type="submit">Reservar</button>
            </div>
          </form>
        </div>

        <div class="panel route-panel">
          <div class="section-heading">
            <span class="eyebrow">Agenda</span>
            <h2>Paseos</h2>
          </div>
          <ul id="scheduleList" class="schedule-list"></ul>
        </div>
      </section>

      <section id="registros" class="section-grid registry-section">
        <article class="panel">
          <div class="section-heading">
            <span class="eyebrow">Dueños</span>
            <h2>Registrar dueño</h2>
          </div>
          <form id="ownerForm" class="stacked-form">
            <input id="ownerName" placeholder="Nombre completo" required />
            <input id="ownerPhone" placeholder="Teléfono" />
            <input id="ownerEmail" type="email" placeholder="Correo" />
            <input id="ownerZone" placeholder="Zona" />
            <input id="ownerAddress" placeholder="Dirección aproximada" />
            <textarea id="ownerNotes" rows="3" placeholder="Notas adicionales"></textarea>
            <button class="primary-btn" type="submit">Guardar dueño</button>
          </form>
        </article>

        <article class="panel">
          <div class="section-heading">
            <span class="eyebrow">Perros</span>
            <h2>Registrar perro</h2>
          </div>
          <form id="dogForm" class="stacked-form">
            <select id="dogOwner" required></select>
            <input id="dogName" placeholder="Nombre del perro" required />
            <input id="dogBreed" placeholder="Raza" />
            <input id="dogAge" type="number" min="0" placeholder="Edad" />
            <select id="dogSize">
              <option>Pequeño</option>
              <option selected>Mediano</option>
              <option>Grande</option>
            </select>
            <select id="dogEnergy">
              <option>Tranquilo</option>
              <option selected>Activo</option>
              <option>Muy activo</option>
            </select>
            <textarea id="dogNotes" rows="3" placeholder="Comportamiento, salud, preferencias"></textarea>
            <button class="primary-btn" type="submit">Guardar perro</button>
          </form>
        </article>
      </section>

      <section id="paseadores" class="section-grid walkers-section">
        <article class="panel">
          <div class="section-heading">
            <span class="eyebrow">Paseadores</span>
            <h2>Registrar paseador</h2>
          </div>
          <form id="walkerForm" class="stacked-form">
            <input id="walkerName" placeholder="Nombre completo" required />
            <input id="walkerPhone" placeholder="Teléfono" />
            <input id="walkerEmail" type="email" placeholder="Correo" />
            <input id="walkerZone" placeholder="Zona de cobertura" />
            <input id="walkerRate" type="number" min="0" placeholder="Tarifa por minuto. Ej: 120" />
            <input id="walkerDistance" placeholder="Distancia. Ej: 0.8 km" />
            <input id="walkerTags" placeholder="Etiquetas separadas por coma. Ej: Perros grandes, Entrenamiento" />
            <select id="walkerStatus">
              <option>Disponible</option>
              <option>No disponible</option>
              <option>En revisión</option>
            </select>
            <textarea id="walkerNotes" rows="3" placeholder="Experiencia, disponibilidad o detalles relevantes"></textarea>
            <button class="primary-btn" type="submit">Guardar paseador</button>
          </form>
        </article>

        <article class="panel">
          <div class="section-heading">
            <span class="eyebrow">Disponibles</span>
            <h2>Listado de paseadores</h2>
          </div>
          <div id="walkerList" class="card-list"></div>
        </article>
      </section>

      <section id="admin" class="panel admin-panel">
        <div class="section-heading horizontal">
          <div>
            <span class="eyebrow">Panel</span>
            <h2>Registros guardados</h2>
          </div>
          <div class="mode-switch" role="tablist" aria-label="Vista de usuario">
            <button class="mode-btn active" type="button" data-mode="owner">Dueño</button>
            <button class="mode-btn" type="button" data-mode="walker">Paseador</button>
          </div>
        </div>
        <div class="admin-grid">
          <div>
            <h3>Dueños</h3>
            <div id="ownerList" class="card-list compact-list"></div>
          </div>
          <div>
            <h3>Perros</h3>
            <div id="dogList" class="card-list compact-list"></div>
          </div>
          <div>
            <h3>Solicitudes / paseos</h3>
            <div id="requestList" class="card-list compact-list"></div>
          </div>
        </div>
      </section>
    </main>

    <div id="toast" class="toast" role="status" aria-live="polite"></div>
  `;
}

function bindElements() {
  [
    'dataStatusTitle',
    'dataStatusDescription',
    'seedButton',
    'ownerCount',
    'dogCount',
    'walkerCount',
    'walkCount',
    'bookingForm',
    'walkDog',
    'walkOwner',
    'walkWalker',
    'walkDate',
    'walkTime',
    'walkDuration',
    'walkRoute',
    'walkNotes',
    'estimateTotal',
    'scheduleList',
    'ownerForm',
    'ownerName',
    'ownerPhone',
    'ownerEmail',
    'ownerZone',
    'ownerAddress',
    'ownerNotes',
    'dogForm',
    'dogOwner',
    'dogName',
    'dogBreed',
    'dogAge',
    'dogSize',
    'dogEnergy',
    'dogNotes',
    'walkerForm',
    'walkerName',
    'walkerPhone',
    'walkerEmail',
    'walkerZone',
    'walkerRate',
    'walkerDistance',
    'walkerTags',
    'walkerStatus',
    'walkerNotes',
    'walkerList',
    'ownerList',
    'dogList',
    'requestList',
    'jumpDogRegistration',
    'jumpBooking',
    'toast',
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
  els.modeButtons = [...document.querySelectorAll('.mode-btn')];
}

function bindEvents() {
  els.seedButton.addEventListener('click', seedDemoData);
  els.ownerForm.addEventListener('submit', handleOwnerSubmit);
  els.dogForm.addEventListener('submit', handleDogSubmit);
  els.walkerForm.addEventListener('submit', handleWalkerSubmit);
  els.bookingForm.addEventListener('submit', handleWalkSubmit);
  els.walkDog.addEventListener('change', syncOwnerFromDog);
  els.walkWalker.addEventListener('change', renderEstimate);
  els.walkDuration.addEventListener('change', renderEstimate);
  els.jumpDogRegistration.addEventListener('click', () => scrollToSection('registros'));
  els.jumpBooking.addEventListener('click', () => scrollToSection('agenda'));
  els.modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
}

async function initDataLayer() {
  if (hasAmplifyDataConfig(outputs)) {
    try {
      Amplify.configure(outputs);
      state.client = generateClient();
      state.backend = 'aws';
      return;
    } catch (error) {
      console.warn('No se pudo configurar Amplify. Se usará modo local.', error);
    }
  }
  state.backend = 'local';
}

function hasAmplifyDataConfig(config) {
  return Boolean(config?.data?.url || config?.API?.GraphQL?.endpoint || config?.api?.aws_appsync_graphqlEndpoint);
}

async function loadData() {
  if (state.backend === 'aws') {
    try {
      const [owners, dogs, walkers, walks] = await Promise.all([
        listAwsRecords('Owner'),
        listAwsRecords('Dog'),
        listAwsRecords('Walker'),
        listAwsRecords('Walk'),
      ]);
      state.owners = owners;
      state.dogs = dogs;
      state.walkers = walkers;
      state.walks = sortWalks(walks);
      return;
    } catch (error) {
      console.warn('No se pudo leer desde AWS. Se usará modo local.', error);
      state.backend = 'local';
    }
  }

  const saved = readLocalState();
  state.owners = saved.owners;
  state.dogs = saved.dogs;
  state.walkers = saved.walkers;
  state.walks = sortWalks(saved.walks);
}

async function listAwsRecords(model) {
  const response = await state.client.models[model].list({ authMode: 'apiKey' });
  if (response.errors?.length) {
    throw new Error(response.errors.map((error) => error.message).join(', '));
  }
  return response.data ?? [];
}

function readLocalState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.owners && parsed?.dogs && parsed?.walkers && parsed?.walks) {
      return parsed;
    }
  } catch (error) {
    console.warn('No se pudo leer localStorage.', error);
  }
  return clone(demoData);
}

function persistLocalState() {
  if (state.backend !== 'local') return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      owners: state.owners,
      dogs: state.dogs,
      walkers: state.walkers,
      walks: state.walks,
    }),
  );
}

function renderAll() {
  applyDefaults();
  renderDataStatus();
  renderSelectors();
  renderEstimate();
  renderMetrics();
  renderSchedule();
  renderOwners();
  renderDogs();
  renderWalkers();
  renderRequests();
  renderMode();
}

function applyDefaults() {
  els.walkDate.value ||= getLocalDateISO();
  els.walkTime.value ||= '16:30';
  state.selectedOwnerId ||= state.owners[0]?.id ?? '';
  state.selectedDogId ||= state.dogs[0]?.id ?? '';
  state.selectedWalkerId ||= state.walkers[0]?.id ?? '';
}

function renderDataStatus() {
  if (state.backend === 'aws') {
    els.dataStatusTitle.textContent = 'AWS conectado';
    els.dataStatusDescription.textContent = 'Los registros se están leyendo y guardando mediante Amplify Data y DynamoDB.';
    els.seedButton.textContent = 'Cargar datos demo en AWS';
    return;
  }
  els.dataStatusTitle.textContent = 'Modo local activo';
  els.dataStatusDescription.textContent = 'La app funciona, pero guarda en este navegador hasta que ejecutés Amplify Sandbox o el deploy fullstack.';
  els.seedButton.textContent = 'Restaurar datos demo';
}

function renderSelectors() {
  renderSelect(els.walkOwner, state.owners, 'Seleccioná un dueño');
  renderSelect(els.dogOwner, state.owners, 'Seleccioná un dueño');
  renderSelect(els.walkDog, state.dogs, 'Seleccioná un perro', (dog) => `${dog.name} · ${dog.breed || 'Sin raza'}`);
  renderSelect(els.walkWalker, state.walkers, 'Seleccioná un paseador', (walker) => `${walker.name} · CRC ${walker.rate || 0}/min`);

  els.walkOwner.value = state.selectedOwnerId;
  els.dogOwner.value = state.selectedOwnerId;
  els.walkDog.value = state.selectedDogId;
  els.walkWalker.value = state.selectedWalkerId;
}

function renderSelect(element, records, fallbackLabel, formatter = (record) => record.name) {
  element.innerHTML = records.length
    ? records.map((record) => `<option value="${escapeHTML(record.id)}">${escapeHTML(formatter(record))}</option>`).join('')
    : `<option value="">${escapeHTML(fallbackLabel)}</option>`;
}

function renderMetrics() {
  els.ownerCount.textContent = state.owners.length;
  els.dogCount.textContent = state.dogs.length;
  els.walkerCount.textContent = state.walkers.filter((walker) => walker.status !== 'No disponible').length;
  els.walkCount.textContent = state.walks.length;
}

function renderEstimate() {
  const walker = findById(state.walkers, els.walkWalker.value || state.selectedWalkerId);
  const duration = Number(els.walkDuration.value || 45);
  const estimate = calculateEstimate(walker?.rate ?? 0, duration);
  els.estimateTotal.textContent = `CRC ${estimate.toLocaleString('es-CR')}`;
}

function renderSchedule() {
  if (!state.walks.length) {
    els.scheduleList.innerHTML = emptyState('No hay paseos registrados todavía.');
    return;
  }

  els.scheduleList.innerHTML = state.walks
    .map((walk) => {
      const dog = findById(state.dogs, walk.dogId);
      const owner = findById(state.owners, walk.ownerId);
      const walker = findById(state.walkers, walk.walkerId);
      return `
        <li class="schedule-item">
          <div>
            <strong>${escapeHTML(formatShortTime(walk.time))}</strong>
            <span>${escapeHTML(dog?.name ?? 'Perro sin asignar')} con ${escapeHTML(firstName(walker?.name ?? 'Sin paseador'))}</span>
            <small>${escapeHTML(formatDate(walk.date))} · ${walk.duration} min · ${escapeHTML(walk.route ?? 'Sin ruta')} · ${escapeHTML(owner?.name ?? 'Sin dueño')}</small>
          </div>
          <div class="item-actions">
            <span class="status-pill ${statusClass(walk.status)}">${escapeHTML(walk.status ?? 'Pendiente')}</span>
            <button class="mini-btn" type="button" data-action="confirm-walk" data-id="${escapeHTML(walk.id)}">Confirmar</button>
            <button class="mini-btn danger" type="button" data-action="delete-walk" data-id="${escapeHTML(walk.id)}">Eliminar</button>
          </div>
        </li>
      `;
    })
    .join('');

  els.scheduleList.querySelectorAll('[data-action="confirm-walk"]').forEach((button) => {
    button.addEventListener('click', () => updateWalkStatus(button.dataset.id, 'Confirmado'));
  });
  els.scheduleList.querySelectorAll('[data-action="delete-walk"]').forEach((button) => {
    button.addEventListener('click', () => deleteRecord('Walk', button.dataset.id));
  });
}

function renderOwners() {
  els.ownerList.innerHTML = state.owners.length
    ? state.owners
        .map(
          (owner) => `
          <article class="mini-card">
            <div>
              <strong>${escapeHTML(owner.name)}</strong>
              <span>${escapeHTML(owner.phone ?? 'Sin teléfono')} · ${escapeHTML(owner.zone ?? 'Sin zona')}</span>
              <small>${escapeHTML(owner.email ?? '')}</small>
            </div>
            <button class="mini-btn danger" type="button" data-action="delete-owner" data-id="${escapeHTML(owner.id)}">Eliminar</button>
          </article>
        `,
        )
        .join('')
    : emptyState('No hay dueños registrados.');

  els.ownerList.querySelectorAll('[data-action="delete-owner"]').forEach((button) => {
    button.addEventListener('click', () => deleteOwnerCascade(button.dataset.id));
  });
}

function renderDogs() {
  els.dogList.innerHTML = state.dogs.length
    ? state.dogs
        .map((dog) => {
          const owner = findById(state.owners, dog.ownerId);
          return `
          <article class="mini-card">
            <div>
              <strong>${escapeHTML(dog.name)}</strong>
              <span>${escapeHTML(dog.breed ?? 'Sin raza')} · ${escapeHTML(dog.energy ?? 'Sin energía')} · ${escapeHTML(dog.size ?? 'Sin tamaño')}</span>
              <small>Dueño: ${escapeHTML(owner?.name ?? 'Sin dueño')}</small>
            </div>
            <button class="mini-btn danger" type="button" data-action="delete-dog" data-id="${escapeHTML(dog.id)}">Eliminar</button>
          </article>
        `;
        })
        .join('')
    : emptyState('No hay perros registrados.');

  els.dogList.querySelectorAll('[data-action="delete-dog"]').forEach((button) => {
    button.addEventListener('click', () => deleteDogCascade(button.dataset.id));
  });
}

function renderWalkers() {
  els.walkerList.innerHTML = state.walkers.length
    ? state.walkers
        .map(
          (walker) => `
          <article class="walker-card">
            <div class="avatar">${escapeHTML(initials(walker.name))}</div>
            <div>
              <strong>${escapeHTML(walker.name)}</strong>
              <span>${escapeHTML(walker.zone ?? 'Sin zona')} · ${escapeHTML(walker.distance ?? 'Sin distancia')}</span>
              <small>CRC ${(walker.rate ?? 0).toLocaleString('es-CR')}/min · ${escapeHTML((walker.tags ?? []).join(', '))}</small>
            </div>
            <span class="status-pill ${statusClass(walker.status)}">${escapeHTML(walker.status ?? 'Disponible')}</span>
          </article>
        `,
        )
        .join('')
    : emptyState('No hay paseadores registrados.');
}

function renderRequests() {
  const pending = state.walks.filter((walk) => ['Pendiente', 'Solicitado'].includes(walk.status ?? 'Pendiente'));
  els.requestList.innerHTML = pending.length
    ? pending
        .map((walk) => {
          const dog = findById(state.dogs, walk.dogId);
          const walker = findById(state.walkers, walk.walkerId);
          return `
            <article class="mini-card">
              <div>
                <strong>${escapeHTML(dog?.name ?? 'Perro')} · ${walk.duration} min</strong>
                <span>${escapeHTML(formatDate(walk.date))} a las ${escapeHTML(formatShortTime(walk.time))} · ${escapeHTML(walk.route ?? 'Sin ruta')}</span>
                <small>Paseador: ${escapeHTML(walker?.name ?? 'Sin paseador')} · CRC ${(walk.estimatedCost ?? 0).toLocaleString('es-CR')}</small>
              </div>
              <button class="mini-btn" type="button" data-action="accept-walk" data-id="${escapeHTML(walk.id)}">Aceptar</button>
            </article>
          `;
        })
        .join('')
    : emptyState('No hay solicitudes pendientes.');

  els.requestList.querySelectorAll('[data-action="accept-walk"]').forEach((button) => {
    button.addEventListener('click', () => updateWalkStatus(button.dataset.id, 'Aceptado'));
  });
}

function renderMode() {
  els.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });
  document.body.dataset.mode = state.mode;
}

async function handleOwnerSubmit(event) {
  event.preventDefault();
  const payload = compactPayload({
    name: els.ownerName.value.trim(),
    phone: els.ownerPhone.value.trim(),
    email: els.ownerEmail.value.trim(),
    zone: els.ownerZone.value.trim(),
    address: els.ownerAddress.value.trim(),
    notes: els.ownerNotes.value.trim(),
  });
  if (!payload.name) return showToast('Ingresá el nombre del dueño.');
  const owner = await createRecord('Owner', payload);
  state.selectedOwnerId = owner.id;
  els.ownerForm.reset();
  renderAll();
  showToast('Dueño guardado correctamente.');
}

async function handleDogSubmit(event) {
  event.preventDefault();
  const payload = compactPayload({
    ownerId: els.dogOwner.value,
    name: els.dogName.value.trim(),
    breed: els.dogBreed.value.trim(),
    age: Number(els.dogAge.value || 0),
    size: els.dogSize.value,
    energy: els.dogEnergy.value,
    notes: els.dogNotes.value.trim(),
  });
  if (!payload.ownerId) return showToast('Primero registrá o seleccioná un dueño.');
  if (!payload.name) return showToast('Ingresá el nombre del perro.');
  const dog = await createRecord('Dog', payload);
  state.selectedDogId = dog.id;
  els.dogForm.reset();
  renderAll();
  showToast('Perro guardado correctamente.');
}

async function handleWalkerSubmit(event) {
  event.preventDefault();
  const payload = compactPayload({
    name: els.walkerName.value.trim(),
    phone: els.walkerPhone.value.trim(),
    email: els.walkerEmail.value.trim(),
    zone: els.walkerZone.value.trim(),
    rate: Number(els.walkerRate.value || 0),
    rating: 5,
    distance: els.walkerDistance.value.trim(),
    tags: els.walkerTags.value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    availability: 'Hoy',
    status: els.walkerStatus.value,
    notes: els.walkerNotes.value.trim(),
  });
  if (!payload.name) return showToast('Ingresá el nombre del paseador.');
  const walker = await createRecord('Walker', payload);
  state.selectedWalkerId = walker.id;
  els.walkerForm.reset();
  renderAll();
  showToast('Paseador guardado correctamente.');
}

async function handleWalkSubmit(event) {
  event.preventDefault();
  const walker = findById(state.walkers, els.walkWalker.value);
  const duration = Number(els.walkDuration.value || 45);
  const payload = compactPayload({
    ownerId: els.walkOwner.value,
    dogId: els.walkDog.value,
    walkerId: els.walkWalker.value,
    date: els.walkDate.value,
    time: els.walkTime.value,
    duration,
    route: els.walkRoute.value,
    status: 'Pendiente',
    estimatedCost: calculateEstimate(walker?.rate ?? 0, duration),
    notes: els.walkNotes.value.trim(),
  });
  if (!payload.ownerId || !payload.dogId || !payload.walkerId) {
    return showToast('Necesitás dueño, perro y paseador para reservar.');
  }
  await createRecord('Walk', payload);
  els.bookingForm.reset();
  els.walkDate.value = getLocalDateISO();
  els.walkTime.value = '16:30';
  await refreshData();
  scrollToSection('agenda');
  showToast('Paseo reservado y guardado.');
}

async function createRecord(model, payload) {
  if (state.backend === 'aws') {
    const response = await state.client.models[model].create(payload, { authMode: 'apiKey' });
    if (response.errors?.length) throw new Error(response.errors.map((error) => error.message).join(', '));
    await refreshData(false);
    return response.data;
  }

  const record = { id: `${model.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 9999)}`, ...payload };
  const collectionName = collectionForModel(model);
  state[collectionName].push(record);
  persistLocalState();
  return record;
}

async function updateWalkStatus(id, status) {
  if (!id) return;
  if (state.backend === 'aws') {
    const response = await state.client.models.Walk.update({ id, status }, { authMode: 'apiKey' });
    if (response.errors?.length) throw new Error(response.errors.map((error) => error.message).join(', '));
  } else {
    state.walks = state.walks.map((walk) => (walk.id === id ? { ...walk, status } : walk));
    persistLocalState();
  }
  await refreshData();
  showToast(`Paseo marcado como ${status.toLowerCase()}.`);
}

async function deleteRecord(model, id, shouldRefresh = true) {
  if (!id) return;
  if (state.backend === 'aws') {
    const response = await state.client.models[model].delete({ id }, { authMode: 'apiKey' });
    if (response.errors?.length) throw new Error(response.errors.map((error) => error.message).join(', '));
  } else {
    const collectionName = collectionForModel(model);
    state[collectionName] = state[collectionName].filter((record) => record.id !== id);
    persistLocalState();
  }
  if (shouldRefresh) {
    await refreshData();
    showToast('Registro eliminado.');
  }
}

async function deleteOwnerCascade(ownerId) {
  const affectedDogs = state.dogs.filter((dog) => dog.ownerId === ownerId).map((dog) => dog.id);
  const affectedWalks = state.walks.filter((walk) => walk.ownerId === ownerId || affectedDogs.includes(walk.dogId));
  const confirmed = window.confirm(`Eliminar este dueño también eliminará ${affectedDogs.length} perro(s) y ${affectedWalks.length} paseo(s).`);
  if (!confirmed) return;

  for (const walk of affectedWalks) await deleteRecord('Walk', walk.id, false);
  for (const dogId of affectedDogs) await deleteRecord('Dog', dogId, false);
  await deleteRecord('Owner', ownerId, false);
  await refreshData();
  showToast('Dueño eliminado con sus registros asociados.');
}

async function deleteDogCascade(dogId) {
  const affectedWalks = state.walks.filter((walk) => walk.dogId === dogId);
  const confirmed = window.confirm(`Eliminar este perro también eliminará ${affectedWalks.length} paseo(s).`);
  if (!confirmed) return;

  for (const walk of affectedWalks) await deleteRecord('Walk', walk.id, false);
  await deleteRecord('Dog', dogId, false);
  await refreshData();
  showToast('Perro eliminado con sus paseos asociados.');
}

async function seedDemoData() {
  if (state.backend === 'aws') {
    const ownerMap = new Map();
    const dogMap = new Map();
    const walkerMap = new Map();

    for (const owner of demoData.owners) {
      const { id, ...payload } = owner;
      const created = await createRecord('Owner', payload);
      ownerMap.set(id, created.id);
    }
    for (const walker of demoData.walkers) {
      const { id, ...payload } = walker;
      const created = await createRecord('Walker', payload);
      walkerMap.set(id, created.id);
    }
    for (const dog of demoData.dogs) {
      const { id, ownerId, ...payload } = dog;
      const created = await createRecord('Dog', { ...payload, ownerId: ownerMap.get(ownerId) });
      dogMap.set(id, created.id);
    }
    for (const walk of demoData.walks) {
      const { id, ownerId, dogId, walkerId, ...payload } = walk;
      await createRecord('Walk', {
        ...payload,
        ownerId: ownerMap.get(ownerId),
        dogId: dogMap.get(dogId),
        walkerId: walkerMap.get(walkerId),
      });
    }
    await refreshData();
    showToast('Datos demo cargados en AWS.');
    return;
  }

  state.owners = clone(demoData.owners);
  state.dogs = clone(demoData.dogs);
  state.walkers = clone(demoData.walkers);
  state.walks = clone(demoData.walks);
  persistLocalState();
  renderAll();
  showToast('Datos demo restaurados en modo local.');
}

async function refreshData(shouldRender = true) {
  await loadData();
  if (shouldRender) renderAll();
}

function syncOwnerFromDog() {
  const dog = findById(state.dogs, els.walkDog.value);
  if (dog?.ownerId) {
    els.walkOwner.value = dog.ownerId;
    state.selectedOwnerId = dog.ownerId;
  }
  state.selectedDogId = els.walkDog.value;
}

function setMode(mode) {
  state.mode = mode;
  renderMode();
  showToast(mode === 'walker' ? 'Vista de paseador activa.' : 'Vista de dueño activa.');
}

function collectionForModel(model) {
  return `${model.charAt(0).toLowerCase()}${model.slice(1)}s`;
}

function calculateEstimate(rate, duration) {
  return Math.round(rate * duration + 650);
}

function compactPayload(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== '' && value !== undefined && value !== null));
}

function sortWalks(walks) {
  return [...walks].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

function findById(collection, id) {
  return collection.find((record) => record.id === id);
}

function firstName(name) {
  return String(name).split(' ')[0] || name;
}

function initials(name) {
  return String(name)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getLocalDateISO() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-CR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

function formatShortTime(value) {
  if (!value) return 'Sin hora';
  const [hours, minutes] = String(value).split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return new Intl.DateTimeFormat('es-CR', { hour: 'numeric', minute: '2-digit' }).format(date);
}

function statusClass(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('confirm') || normalized.includes('acept')) return 'success';
  if (normalized.includes('no')) return 'danger';
  if (normalized.includes('revisión') || normalized.includes('pend')) return 'warning';
  return 'neutral';
}

function emptyState(message) {
  return `<p class="empty-state">${escapeHTML(message)}</p>`;
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => els.toast.classList.remove('show'), 2800);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
