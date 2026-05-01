
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import outputs from '../amplify_outputs.json';
import './styles.css';

const STORAGE_KEY = 'paseocan-state-v3';

const ASSETS = {
  heroDesktop: '/assets/01-hero-desktop.webp',
  heroDesktopFallback: '/assets/01-hero-desktop.jpg',
  heroMobile: '/assets/02-hero-mobile.webp',
  register: '/assets/03-registro-perro.webp',
  reserve: '/assets/04-reserva-paseo.webp',
  tracking: '/assets/05-seguimiento-paseo.webp',
  walker: '/assets/06-paseador-destacado.webp',
  bigDog: '/assets/07-perro-grande.webp',
  smallDog: '/assets/08-perro-pequeno-mediano.webp',
  trust: '/assets/09-confianza-cuidado.webp',
  finalCta: '/assets/10-cta-final.webp',
};

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
    <header class="site-header" id="top">
      <div class="top-strip">
        <div class="top-strip-inner">
          <span>San José, Costa Rica</span>
          <span>Reservas de paseos, perfiles de perros y seguimiento en un solo lugar.</span>
        </div>
      </div>

      <nav class="nav-shell" aria-label="Navegación principal">
        <a href="#inicio" class="brand" aria-label="PaseoCan inicio">
          <span class="brand-mark">PC</span>
          <span>
            <strong>PaseoCan</strong>
            <small>Paseos seguros para perros</small>
          </span>
        </a>

        <button class="menu-toggle" id="menuToggle" type="button" aria-label="Abrir menú" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>

        <div class="nav-links" id="navLinks">
          <a href="#inicio">Inicio</a>
          <a href="#destacados">Servicios</a>
          <div class="nav-dropdown">
            <button type="button">Categorías</button>
            <div class="dropdown-menu" aria-label="Categorías de servicio">
              <a href="#reserva">Reservar paseo</a>
              <a href="#registros">Registrar perro</a>
              <a href="#paseadores">Paseadores</a>
              <a href="#panel">Panel interno</a>
            </div>
          </div>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#blog">Blog</a>
          <a href="#footer">Contacto</a>
        </div>

        <div class="nav-actions">
          <button class="icon-action" id="searchToggle" type="button" aria-label="Buscar">⌕</button>
          <button class="request-toggle" id="drawerToggle" type="button" aria-label="Ver solicitudes">
            <span>Solicitudes</span>
            <strong id="cartBadge">0</strong>
          </button>
          <button class="nav-cta" id="quickReserve" type="button">Reservar</button>
        </div>
      </nav>
    </header>

    <aside class="search-panel" id="searchPanel" aria-label="Búsqueda rápida">
      <div class="search-box">
        <div class="panel-heading clean">
          <div>
            <span class="eyebrow">Buscar</span>
            <h3>Encontrá rápido lo que necesitás</h3>
          </div>
          <button class="icon-btn" id="searchClose" type="button" aria-label="Cerrar búsqueda">×</button>
        </div>
        <form id="searchForm" class="search-form">
          <input id="siteSearch" type="search" placeholder="Ej: reservar, perro, paseadores, agenda..." />
          <button class="primary-btn" type="submit">Ir</button>
        </form>
        <div class="quick-links">
          <button type="button" data-scroll-target="reserva">Reservar paseo</button>
          <button type="button" data-scroll-target="registros">Registrar perro</button>
          <button type="button" data-scroll-target="paseadores">Ver paseadores</button>
          <button type="button" data-scroll-target="panel">Panel interno</button>
        </div>
      </div>
    </aside>

    <aside class="request-drawer" id="requestDrawer" aria-label="Solicitudes recientes">
      <div class="drawer-head">
        <div>
          <span class="eyebrow">Solicitudes</span>
          <h3>Paseos recientes</h3>
        </div>
        <button class="icon-btn" id="drawerClose" type="button" aria-label="Cerrar solicitudes">×</button>
      </div>
      <div id="requestDrawerList" class="drawer-list"></div>
      <button class="primary-btn full" type="button" data-scroll-target="reserva">Crear nueva reserva</button>
    </aside>

    <main>
      <section id="inicio" class="hero-market" data-reveal>
        <div class="hero-content">
          <span class="eyebrow">Servicio de paseos para perros</span>
          <h1>Paseos listos, perros felices y reservas más simples.</h1>
          <p>Una plataforma para registrar mascotas, coordinar paseadores y dar seguimiento a cada solicitud desde una experiencia clara, visual y responsive.</p>
          <div class="hero-actions">
            <button class="primary-btn" id="jumpBooking" type="button">Reservar paseo</button>
            <button class="secondary-btn" id="jumpDogRegistration" type="button">Registrar mi perro</button>
          </div>
          <div class="hero-badges" aria-label="Beneficios principales">
            <span>Agenda organizada</span>
            <span>Datos centralizados</span>
            <span>Paseadores disponibles</span>
          </div>
        </div>

        <div class="hero-collage" aria-label="Galería de perros PaseoCan">
          <picture class="hero-photo hero-photo-main">
            <source media="(max-width: 680px)" srcset="${ASSETS.heroMobile}" type="image/webp">
            <source srcset="${ASSETS.heroDesktop}" type="image/webp">
            <img src="${ASSETS.heroDesktopFallback}" alt="Perro feliz durante un paseo" loading="eager">
          </picture>
          <img class="hero-photo hero-photo-small one" src="${ASSETS.smallDog}" alt="Perro pequeño registrado en PaseoCan" loading="eager">
          <img class="hero-photo hero-photo-small two" src="${ASSETS.bigDog}" alt="Perro grande listo para paseo" loading="eager">
          <div class="floating-card">
            <strong id="walkCountHero">0</strong>
            <span>paseos en agenda</span>
          </div>
        </div>
      </section>

      <section class="metrics-grid" aria-label="Resumen de PaseoCan" data-reveal>
        <article class="metric-card">
          <span>Dueños</span>
          <strong id="ownerCount">0</strong>
          <small>registrados</small>
        </article>
        <article class="metric-card">
          <span>Perros</span>
          <strong id="dogCount">0</strong>
          <small>perfiles activos</small>
        </article>
        <article class="metric-card">
          <span>Paseadores</span>
          <strong id="walkerCount">0</strong>
          <small>disponibles</small>
        </article>
        <article class="metric-card accent">
          <span>Paseos</span>
          <strong id="walkCount">0</strong>
          <small>en agenda</small>
        </article>
      </section>

      <section id="destacados" class="storefront-section" data-reveal>
        <div class="section-heading center">
          <span class="eyebrow">Servicios destacados</span>
          <h2>Elegí qué querés hacer hoy.</h2>
          <p>Un acceso rápido, visual y directo a las acciones principales de PaseoCan.</p>
        </div>
        <div class="feature-tiles">
          <button class="feature-tile large" type="button" data-scroll-target="reserva">
            <img src="${ASSETS.reserve}" alt="Reservar paseo para perro" loading="lazy">
            <span>Reserva express</span>
            <strong>Agendá un paseo</strong>
          </button>
          <button class="feature-tile" type="button" data-scroll-target="registros">
            <img src="${ASSETS.register}" alt="Registro de perro" loading="lazy">
            <span>Perfiles</span>
            <strong>Registrá a tu perro</strong>
          </button>
          <button class="feature-tile" type="button" data-scroll-target="paseadores">
            <img src="${ASSETS.walker}" alt="Paseadores disponibles" loading="lazy">
            <span>Cobertura</span>
            <strong>Ver paseadores</strong>
          </button>
          <button class="feature-tile wide" type="button" data-scroll-target="panel">
            <img src="${ASSETS.tracking}" alt="Seguimiento de paseo" loading="lazy">
            <span>Seguimiento</span>
            <strong>Revisar solicitudes</strong>
          </button>
        </div>
      </section>

      <section class="categories-section" data-reveal>
        <div class="section-heading compact">
          <span class="eyebrow">Categorías</span>
          <h2>Todo el flujo del paseo, ordenado.</h2>
        </div>
        <div class="category-grid">
          <a href="#registros" class="category-card"><span>01</span><strong>Dueños</strong><small>Contacto y zona</small></a>
          <a href="#registros" class="category-card"><span>02</span><strong>Perros</strong><small>Perfil y cuidados</small></a>
          <a href="#paseadores" class="category-card"><span>03</span><strong>Paseadores</strong><small>Tarifa y cobertura</small></a>
          <a href="#reserva" class="category-card"><span>04</span><strong>Paseos</strong><small>Agenda y estado</small></a>
        </div>
      </section>

      <section id="como-funciona" class="content-section" data-reveal>
        <div class="section-heading center">
          <span class="eyebrow">Cómo funciona</span>
          <h2>Un proceso simple en tres pasos.</h2>
          <p>Diseñado para que el usuario entienda rápido qué debe hacer y pueda completar la solicitud sin fricción.</p>
        </div>

        <div class="steps-grid">
          <article class="step-card">
            <img src="${ASSETS.register}" alt="Perro en casa listo para registrarse" loading="lazy">
            <div>
              <span>01</span>
              <h3>Registrá a tu perro</h3>
              <p>Guardá datos básicos, comportamiento y notas de cuidado.</p>
            </div>
          </article>
          <article class="step-card">
            <img src="${ASSETS.reserve}" alt="Perro caminando con correa en un paseo" loading="lazy">
            <div>
              <span>02</span>
              <h3>Reservá el paseo</h3>
              <p>Seleccioná fecha, hora, ruta, duración y paseador.</p>
            </div>
          </article>
          <article class="step-card">
            <img src="${ASSETS.tracking}" alt="Dueño revisando el seguimiento de un paseo" loading="lazy">
            <div>
              <span>03</span>
              <h3>Dale seguimiento</h3>
              <p>Consultá estados, agenda y solicitudes desde el panel.</p>
            </div>
          </article>
        </div>
      </section>

      <section class="split-section editorial" data-reveal>
        <div class="image-panel">
          <img src="${ASSETS.trust}" alt="Momento de confianza y cuidado entre una persona y un perro" loading="lazy">
        </div>
        <div class="copy-panel">
          <span class="eyebrow">Confianza y orden</span>
          <h2>Una experiencia más clara para dueños y paseadores.</h2>
          <p>Cada solicitud guarda el contexto necesario: dueño, perro, paseador, horario, ruta, notas y estado.</p>
          <ul class="check-list">
            <li>Notas especiales para salud, correa o comportamiento.</li>
            <li>Estados de solicitud fáciles de entender.</li>
            <li>Exportación de registros desde el panel interno.</li>
          </ul>
        </div>
      </section>

      <section id="reserva" class="app-section" data-reveal>
        <div class="section-heading">
          <span class="eyebrow">Reservas</span>
          <h2>Creá una solicitud de paseo.</h2>
          <p>Completá la información del perro, dueño, paseador y horario. Los datos se guardan en AWS cuando el backend está conectado.</p>
        </div>

        <div class="workspace-grid">
          <article class="panel booking-panel">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Nuevo paseo</span>
                <h3>Reserva express</h3>
              </div>
              <span class="status-pill">Solicitud</span>
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
                Indicaciones
                <textarea id="walkNotes" rows="3" placeholder="Comportamiento, medicación, tipo de correa, ruta o detalle relevante."></textarea>
              </label>
              <div class="form-footer full-span">
                <div>
                  <span class="eyebrow">Total estimado</span>
                  <strong id="estimateTotal">CRC 0</strong>
                </div>
                <button class="primary-btn" type="submit">Reservar paseo</button>
              </div>
            </form>
          </article>

          <article class="panel schedule-panel">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Agenda</span>
                <h3>Próximos paseos</h3>
              </div>
              <button class="text-btn" id="refreshButton" type="button">Actualizar</button>
            </div>
            <ul id="scheduleList" class="schedule-list"></ul>
          </article>
        </div>
      </section>

      <section id="registros" class="app-section" data-reveal>
        <div class="section-heading">
          <span class="eyebrow">Registro</span>
          <h2>Guardá la información esencial.</h2>
          <p>Primero registrá el dueño; luego asociá uno o varios perros a ese contacto.</p>
        </div>
        <div class="forms-grid">
          <article class="panel form-panel">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Dueño</span>
                <h3>Registrar dueño</h3>
              </div>
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

          <article class="panel form-panel dog-form-card">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Perro</span>
                <h3>Registrar perro</h3>
              </div>
            </div>
            <form id="dogForm" class="stacked-form">
              <select id="dogOwner" required></select>
              <input id="dogName" placeholder="Nombre del perro" required />
              <input id="dogBreed" placeholder="Raza" />
              <input id="dogAge" type="number" min="0" placeholder="Edad" />
              <div class="two-fields">
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
              </div>
              <textarea id="dogNotes" rows="3" placeholder="Comportamiento, salud, preferencias"></textarea>
              <button class="primary-btn" type="submit">Guardar perro</button>
            </form>
          </article>
        </div>

        <div class="records-grid">
          <article class="panel">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Perfiles</span>
                <h3>Perros registrados</h3>
              </div>
            </div>
            <div id="dogList" class="card-list"></div>
          </article>

          <article class="panel">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Contactos</span>
                <h3>Dueños registrados</h3>
              </div>
            </div>
            <div id="ownerList" class="card-list"></div>
          </article>
        </div>
      </section>

      <section id="paseadores" class="app-section walkers-app" data-reveal>
        <div class="section-heading">
          <span class="eyebrow">Paseadores</span>
          <h2>Administrá disponibilidad y cobertura.</h2>
          <p>Registrá paseadores, zonas de cobertura, tarifa por minuto y especialidades.</p>
        </div>

        <div class="workspace-grid">
          <article class="panel form-panel">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Nuevo paseador</span>
                <h3>Registrar paseador</h3>
              </div>
            </div>
            <form id="walkerForm" class="stacked-form">
              <input id="walkerName" placeholder="Nombre completo" required />
              <input id="walkerPhone" placeholder="Teléfono" />
              <input id="walkerEmail" type="email" placeholder="Correo" />
              <input id="walkerZone" placeholder="Zona de cobertura" />
              <div class="two-fields">
                <input id="walkerRate" type="number" min="0" placeholder="Tarifa/min. Ej: 120" />
                <input id="walkerDistance" placeholder="Distancia. Ej: 0.8 km" />
              </div>
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

          <article class="panel walker-feature">
            <img src="${ASSETS.walker}" alt="Paseador con perro en zona residencial" loading="lazy">
            <div>
              <span class="eyebrow">Disponibilidad</span>
              <h3>Paseadores para distintas necesidades.</h3>
              <p>Definí especialidades, zonas y estado de disponibilidad para asignar mejor cada solicitud.</p>
            </div>
          </article>
        </div>

        <div id="walkerList" class="walker-list"></div>
      </section>

      <section id="blog" class="blog-section" data-reveal>
        <div class="section-heading center">
          <span class="eyebrow">Blog</span>
          <h2>Tips rápidos para mejores paseos.</h2>
        </div>
        <div class="blog-grid">
          <article class="blog-card">
            <img src="${ASSETS.bigDog}" alt="Perro grande en retrato" loading="lazy">
            <div class="date-box"><strong>30</strong><span>Abr</span></div>
            <h3>Cómo preparar a tu perro antes de un paseo nuevo</h3>
            <p>Checklist básico para que el paseador conozca energía, comportamiento y cuidados.</p>
          </article>
          <article class="blog-card">
            <img src="${ASSETS.smallDog}" alt="Perro pequeño" loading="lazy">
            <div class="date-box"><strong>01</strong><span>May</span></div>
            <h3>Qué información debe tener un perfil de mascota</h3>
            <p>Datos útiles para que cada solicitud sea más segura y fácil de asignar.</p>
          </article>
          <article class="blog-card">
            <img src="${ASSETS.finalCta}" alt="Perro disfrutando al aire libre" loading="lazy">
            <div class="date-box"><strong>02</strong><span>May</span></div>
            <h3>Rutas y horarios recomendados según el clima</h3>
            <p>Ideas para planificar paseos más cómodos en zonas urbanas.</p>
          </article>
        </div>
      </section>

      <section class="cta-section" style="--cta-image: url('${ASSETS.finalCta}')" data-reveal>
        <div>
          <span class="eyebrow">Empezá hoy</span>
          <h2>Dejá listo el próximo paseo de tu perro.</h2>
          <p>Registrá la información básica y creá una solicitud clara para que el proceso sea más ordenado desde el inicio.</p>
        </div>
        <button class="primary-btn light" id="bottomBookingButton" type="button">Reservar ahora</button>
      </section>

      <section id="panel" class="panel admin-panel" data-reveal>
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Panel interno</span>
            <h2>Solicitudes y administración</h2>
            <p>Vista de control para revisar registros, actualizar estados y exportar información.</p>
          </div>
        </div>

        <div class="admin-actions">
          <button class="secondary-btn compact" type="button" data-export="owners">Exportar dueños CSV</button>
          <button class="secondary-btn compact" type="button" data-export="dogs">Exportar perros CSV</button>
          <button class="secondary-btn compact" type="button" data-export="walkers">Exportar paseadores CSV</button>
          <button class="secondary-btn compact" type="button" data-export="walks">Exportar paseos CSV</button>
        </div>

        <div id="requestList" class="request-list"></div>

        <details class="debug-panel">
          <summary>Diagnóstico técnico</summary>
          <div class="debug-grid">
            <div>
              <span class="eyebrow">Estado</span>
              <strong id="dataStatusTitle">Preparando conexión</strong>
              <p id="dataStatusDescription">Validando configuración.</p>
            </div>
            <button class="secondary-btn compact" id="seedButton" type="button">Cargar datos demo</button>
          </div>
        </details>
      </section>
    </main>

    <footer class="site-footer" id="footer">
      <div class="footer-grid">
        <div>
          <a href="#inicio" class="brand footer-brand">
            <span class="brand-mark">PC</span>
            <span><strong>PaseoCan</strong><small>Paseos seguros para perros</small></span>
          </a>
          <p>Gestión simple de paseos, perfiles y solicitudes para mascotas.</p>
        </div>
        <div>
          <h4>Servicios</h4>
          <a href="#reserva">Reservar paseo</a>
          <a href="#registros">Registrar perro</a>
          <a href="#paseadores">Paseadores</a>
        </div>
        <div>
          <h4>Información</h4>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#blog">Blog</a>
          <a href="#panel">Panel interno</a>
        </div>
        <div>
          <h4>Contacto</h4>
          <p>San José, Costa Rica</p>
          <p>info@paseocan.test</p>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 PaseoCan. MVP funcional.</span>
        <a href="#inicio">Volver arriba</a>
      </div>
    </footer>

    <button class="sticky-mobile-cta" type="button" data-scroll-target="reserva">Reservar paseo</button>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
  `;
}

function bindElements() {
  [
    'menuToggle',
    'navLinks',
    'dataStatusTitle',
    'dataStatusDescription',
    'seedButton',
    'refreshButton',
    'ownerCount',
    'dogCount',
    'walkerCount',
    'walkCount',
    'walkCountHero',
    'cartBadge',
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
    'requestDrawerList',
    'requestDrawer',
    'drawerToggle',
    'drawerClose',
    'searchToggle',
    'searchPanel',
    'searchClose',
    'searchForm',
    'siteSearch',
    'quickReserve',
    'jumpDogRegistration',
    'jumpBooking',
    'bottomBookingButton',
    'toast',
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
  els.exportButtons = [...document.querySelectorAll('[data-export]')];
  els.scrollButtons = [...document.querySelectorAll('[data-scroll-target]')];
  els.revealItems = [...document.querySelectorAll('[data-reveal]')];
}

function bindEvents() {
  els.menuToggle?.addEventListener('click', toggleMenu);
  els.navLinks?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  els.seedButton?.addEventListener('click', withErrorHandling(seedDemoData));
  els.refreshButton?.addEventListener('click', withErrorHandling(async () => {
    await refreshData();
    showToast('Datos actualizados.');
  }));
  els.ownerForm?.addEventListener('submit', withErrorHandling(handleOwnerSubmit));
  els.dogForm?.addEventListener('submit', withErrorHandling(handleDogSubmit));
  els.walkerForm?.addEventListener('submit', withErrorHandling(handleWalkerSubmit));
  els.bookingForm?.addEventListener('submit', withErrorHandling(handleWalkSubmit));
  els.walkDog?.addEventListener('change', syncOwnerFromDog);
  els.walkWalker?.addEventListener('change', renderEstimate);
  els.walkDuration?.addEventListener('change', renderEstimate);
  els.jumpDogRegistration?.addEventListener('click', () => scrollToSection('registros'));
  els.jumpBooking?.addEventListener('click', () => scrollToSection('reserva'));
  els.bottomBookingButton?.addEventListener('click', () => scrollToSection('reserva'));
  els.quickReserve?.addEventListener('click', () => scrollToSection('reserva'));
  els.drawerToggle?.addEventListener('click', () => toggleDrawer(true));
  els.drawerClose?.addEventListener('click', () => toggleDrawer(false));
  els.searchToggle?.addEventListener('click', () => toggleSearch(true));
  els.searchClose?.addEventListener('click', () => toggleSearch(false));
  els.searchForm?.addEventListener('submit', handleSearchSubmit);
  els.exportButtons.forEach((button) => {
    button.addEventListener('click', () => exportCollection(button.dataset.export));
  });
  els.scrollButtons.forEach((button) => {
    button.addEventListener('click', () => {
      toggleDrawer(false);
      toggleSearch(false);
      scrollToSection(button.dataset.scrollTarget);
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggleDrawer(false);
      toggleSearch(false);
      closeMenu();
    }
  });
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  initRevealObserver();
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
  renderMiniRequests();
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
    els.dataStatusTitle.textContent = 'Conectado a AWS';
    els.dataStatusDescription.textContent = 'Los registros se leen y guardan desde Amplify Data.';
    return;
  }
  els.dataStatusTitle.textContent = 'Modo local';
  els.dataStatusDescription.textContent = 'La app funciona con datos locales hasta que exista configuración de Amplify.';
}

function renderMetrics() {
  els.ownerCount.textContent = state.owners.length;
  els.dogCount.textContent = state.dogs.length;
  els.walkerCount.textContent = state.walkers.filter((walker) => walker.status !== 'No disponible').length;
  els.walkCount.textContent = state.walks.length;
}

function renderSelectors() {
  els.dogOwner.innerHTML = optionList(state.owners, 'Seleccioná dueño');
  els.walkOwner.innerHTML = optionList(state.owners, 'Seleccioná dueño');
  els.walkDog.innerHTML = optionList(state.dogs, 'Seleccioná perro');
  els.walkWalker.innerHTML = optionList(state.walkers.filter((walker) => walker.status !== 'No disponible'), 'Seleccioná paseador');

  if (state.selectedOwnerId) {
    setSelectIfExists(els.dogOwner, state.selectedOwnerId);
    setSelectIfExists(els.walkOwner, state.selectedOwnerId);
  }
  if (state.selectedDogId) setSelectIfExists(els.walkDog, state.selectedDogId);
  if (state.selectedWalkerId) setSelectIfExists(els.walkWalker, state.selectedWalkerId);

  syncOwnerFromDog();
}

function optionList(collection, placeholder) {
  return [
    `<option value="">${placeholder}</option>`,
    ...collection.map((record) => `<option value="${escapeHTML(record.id)}">${escapeHTML(record.name)}</option>`),
  ].join('');
}

function setSelectIfExists(select, value) {
  if ([...select.options].some((option) => option.value === value)) {
    select.value = value;
  }
}

function renderEstimate() {
  const walker = findById(state.walkers, els.walkWalker.value);
  const duration = Number(els.walkDuration.value || 45);
  const total = calculateEstimate(walker?.rate ?? 0, duration);
  els.estimateTotal.textContent = `CRC ${total.toLocaleString('es-CR')}`;
}

function renderSchedule() {
  if (!state.walks.length) {
    els.scheduleList.innerHTML = emptyState('Todavía no hay paseos agendados.');
    return;
  }

  els.scheduleList.innerHTML = state.walks
    .slice(0, 8)
    .map((walk) => {
      const dog = findById(state.dogs, walk.dogId);
      const owner = findById(state.owners, walk.ownerId);
      const walker = findById(state.walkers, walk.walkerId);
      return `
        <li class="schedule-item">
          <div class="date-chip">
            <strong>${escapeHTML(formatDay(walk.date))}</strong>
            <span>${escapeHTML(formatMonth(walk.date))}</span>
          </div>
          <div class="schedule-body">
            <div class="card-topline">
              <strong>${escapeHTML(dog?.name ?? 'Perro sin nombre')}</strong>
              <span class="status-badge ${statusClass(walk.status)}">${escapeHTML(walk.status ?? 'Pendiente')}</span>
            </div>
            <p>${escapeHTML(walk.time ?? '')} · ${escapeHTML(String(walk.duration ?? 0))} min · ${escapeHTML(walk.route ?? 'Ruta por definir')}</p>
            <small>Dueño: ${escapeHTML(owner?.name ?? 'Sin dueño')} · Paseador: ${escapeHTML(walker?.name ?? 'Sin paseador')}</small>
          </div>
        </li>
      `;
    })
    .join('');
}

function renderOwners() {
  els.ownerList.innerHTML = state.owners.length
    ? state.owners
        .map((owner) => `
          <article class="mini-card">
            <div class="avatar">${escapeHTML(initials(owner.name))}</div>
            <div>
              <strong>${escapeHTML(owner.name)}</strong>
              <p>${escapeHTML(owner.zone ?? 'Zona pendiente')} · ${escapeHTML(owner.phone ?? 'Sin teléfono')}</p>
              <small>${escapeHTML(owner.email ?? 'Correo no registrado')}</small>
            </div>
            <button class="icon-btn danger" type="button" data-action="delete-owner" data-id="${escapeHTML(owner.id)}" aria-label="Eliminar dueño">×</button>
          </article>
        `)
        .join('')
    : emptyState('No hay dueños registrados.');

  els.ownerList.querySelectorAll('[data-action="delete-owner"]').forEach((button) => {
    button.addEventListener('click', withErrorHandling(() => deleteOwnerCascade(button.dataset.id)));
  });
}

function renderDogs() {
  els.dogList.innerHTML = state.dogs.length
    ? state.dogs
        .map((dog) => {
          const owner = findById(state.owners, dog.ownerId);
          const image = dog.size === 'Grande' ? ASSETS.bigDog : ASSETS.smallDog;
          return `
            <article class="dog-card">
              <img src="${image}" alt="Foto referencial de perro" loading="lazy">
              <div>
                <div class="card-topline">
                  <strong>${escapeHTML(dog.name)}</strong>
                  <span>${escapeHTML(dog.size ?? 'Tamaño pendiente')}</span>
                </div>
                <p>${escapeHTML(dog.breed ?? 'Raza no indicada')} · ${escapeHTML(String(dog.age ?? 0))} años · ${escapeHTML(dog.energy ?? 'Energía pendiente')}</p>
                <small>Dueño: ${escapeHTML(owner?.name ?? 'Sin dueño')} · ${escapeHTML(dog.notes ?? 'Sin notas')}</small>
              </div>
              <button class="icon-btn danger" type="button" data-action="delete-dog" data-id="${escapeHTML(dog.id)}" aria-label="Eliminar perro">×</button>
            </article>
          `;
        })
        .join('')
    : emptyState('No hay perros registrados.');

  els.dogList.querySelectorAll('[data-action="delete-dog"]').forEach((button) => {
    button.addEventListener('click', withErrorHandling(() => deleteDogCascade(button.dataset.id)));
  });
}

function renderWalkers() {
  els.walkerList.innerHTML = state.walkers.length
    ? state.walkers
        .map((walker) => {
          const tags = Array.isArray(walker.tags) ? walker.tags : [];
          return `
            <article class="walker-card">
              <div class="walker-avatar">
                <img src="${ASSETS.walker}" alt="Paseador disponible" loading="lazy">
              </div>
              <div>
                <div class="card-topline">
                  <strong>${escapeHTML(walker.name)}</strong>
                  <span class="status-badge ${walker.status === 'Disponible' ? 'ok' : 'hold'}">${escapeHTML(walker.status ?? 'Disponible')}</span>
                </div>
                <p>${escapeHTML(walker.zone ?? 'Zona pendiente')} · ${escapeHTML(walker.distance ?? 'Distancia por definir')}</p>
                <small>CRC ${Number(walker.rate ?? 0).toLocaleString('es-CR')}/min · ★ ${Number(walker.rating ?? 5).toFixed(1)}</small>
                <div class="tag-row">
                  ${tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join('')}
                </div>
              </div>
              <button class="icon-btn danger" type="button" data-action="delete-walker" data-id="${escapeHTML(walker.id)}" aria-label="Eliminar paseador">×</button>
            </article>
          `;
        })
        .join('')
    : emptyState('No hay paseadores registrados.');

  els.walkerList.querySelectorAll('[data-action="delete-walker"]').forEach((button) => {
    button.addEventListener('click', withErrorHandling(() => deleteRecord('Walker', button.dataset.id)));
  });
}

function renderRequests() {
  if (!state.walks.length) {
    els.requestList.innerHTML = emptyState('No hay solicitudes registradas.');
    return;
  }

  els.requestList.innerHTML = state.walks
    .map((walk) => {
      const dog = findById(state.dogs, walk.dogId);
      const owner = findById(state.owners, walk.ownerId);
      const walker = findById(state.walkers, walk.walkerId);
      return `
        <article class="request-card">
          <div>
            <div class="card-topline">
              <strong>${escapeHTML(dog?.name ?? 'Perro sin nombre')}</strong>
              <span class="status-badge ${statusClass(walk.status)}">${escapeHTML(walk.status ?? 'Pendiente')}</span>
            </div>
            <p>${escapeHTML(formatDate(walk.date))} · ${escapeHTML(walk.time ?? '')} · ${escapeHTML(String(walk.duration ?? 0))} min · ${escapeHTML(walk.route ?? 'Ruta por definir')}</p>
            <small>Dueño: ${escapeHTML(owner?.name ?? 'Sin dueño')} · Paseador: ${escapeHTML(walker?.name ?? 'Sin paseador')} · CRC ${Number(walk.estimatedCost ?? 0).toLocaleString('es-CR')}</small>
          </div>
          <div class="request-actions">
            <button class="mini-btn" type="button" data-action="walk-status" data-status="Confirmado" data-id="${escapeHTML(walk.id)}">Confirmar</button>
            <button class="mini-btn" type="button" data-action="walk-status" data-status="Completado" data-id="${escapeHTML(walk.id)}">Completar</button>
            <button class="mini-btn ghost" type="button" data-action="walk-status" data-status="Cancelado" data-id="${escapeHTML(walk.id)}">Cancelar</button>
            <button class="icon-btn danger" type="button" data-action="delete-walk" data-id="${escapeHTML(walk.id)}" aria-label="Eliminar paseo">×</button>
          </div>
        </article>
      `;
    })
    .join('');

  els.requestList.querySelectorAll('[data-action="walk-status"]').forEach((button) => {
    button.addEventListener('click', withErrorHandling(() => updateWalkStatus(button.dataset.id, button.dataset.status)));
  });

  els.requestList.querySelectorAll('[data-action="delete-walk"]').forEach((button) => {
    button.addEventListener('click', withErrorHandling(() => deleteRecord('Walk', button.dataset.id)));
  });
}


function renderMiniRequests() {
  if (els.cartBadge) els.cartBadge.textContent = state.walks.length;
  if (els.walkCountHero) els.walkCountHero.textContent = state.walks.length;
  if (!els.requestDrawerList) return;

  if (!state.walks.length) {
    els.requestDrawerList.innerHTML = emptyState('Todavía no hay solicitudes.');
    return;
  }

  els.requestDrawerList.innerHTML = state.walks
    .slice(0, 5)
    .map((walk) => {
      const dog = findById(state.dogs, walk.dogId);
      const walker = findById(state.walkers, walk.walkerId);
      return `
        <article class="drawer-card">
          <div class="card-topline">
            <strong>${escapeHTML(dog?.name ?? 'Perro')}</strong>
            <span class="status-badge ${statusClass(walk.status)}">${escapeHTML(walk.status ?? 'Pendiente')}</span>
          </div>
          <p>${escapeHTML(formatDate(walk.date))} · ${escapeHTML(walk.time ?? '')} · ${escapeHTML(String(walk.duration ?? 0))} min</p>
          <small>${escapeHTML(walker?.name ?? 'Sin paseador asignado')}</small>
        </article>
      `;
    })
    .join('');
}

function toggleDrawer(force) {
  if (!els.requestDrawer) return;
  const shouldOpen = typeof force === 'boolean' ? force : !els.requestDrawer.classList.contains('open');
  els.requestDrawer.classList.toggle('open', shouldOpen);
}

function toggleSearch(force) {
  if (!els.searchPanel) return;
  const shouldOpen = typeof force === 'boolean' ? force : !els.searchPanel.classList.contains('open');
  els.searchPanel.classList.toggle('open', shouldOpen);
  if (shouldOpen) setTimeout(() => els.siteSearch?.focus(), 50);
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const query = els.siteSearch.value.trim().toLowerCase();
  const map = [
    { terms: ['reserv', 'paseo', 'agenda', 'solicitud'], id: 'reserva' },
    { terms: ['perro', 'dueño', 'dueno', 'registro', 'mascota'], id: 'registros' },
    { terms: ['paseador', 'cobertura', 'tarifa'], id: 'paseadores' },
    { terms: ['panel', 'csv', 'export', 'estado'], id: 'panel' },
    { terms: ['blog', 'tips', 'consejo'], id: 'blog' },
  ];
  const match = map.find((item) => item.terms.some((term) => query.includes(term)));
  if (match) {
    toggleSearch(false);
    scrollToSection(match.id);
    return;
  }
  showToast('Probá buscar: reservar, perro, paseadores, agenda o panel.');
}

function updateHeaderState() {
  document.querySelector('.site-header')?.classList.toggle('scrolled', window.scrollY > 12);
}

function initRevealObserver() {
  if (!('IntersectionObserver' in window)) {
    els.revealItems.forEach((item) => item.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  els.revealItems.forEach((item) => observer.observe(item));
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
  scrollToSection('reserva');
  showToast('Paseo reservado correctamente.');
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
  const confirmed = !shouldRefresh || model === 'Walk' || window.confirm('¿Seguro que querés eliminar este registro?');
  if (!confirmed) return;

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
    showToast('Datos demo cargados.');
    return;
  }

  state.owners = clone(demoData.owners);
  state.dogs = clone(demoData.dogs);
  state.walkers = clone(demoData.walkers);
  state.walks = clone(demoData.walks);
  persistLocalState();
  renderAll();
  showToast('Datos demo restaurados.');
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
  renderEstimate();
}

function exportCollection(collectionName) {
  const collection = state[collectionName] ?? [];
  if (!collection.length) return showToast('No hay datos para exportar.');
  const csv = toCSV(collection);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `paseocan-${collectionName}-${getLocalDateISO()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows) {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = Array.isArray(row[header]) ? row[header].join(' | ') : row[header] ?? '';
          return `"${String(value).replaceAll('"', '""')}"`;
        })
        .join(','),
    ),
  ];
  return lines.join('\n');
}

function toggleMenu() {
  const isOpen = els.navLinks.classList.toggle('open');
  els.menuToggle.setAttribute('aria-expanded', String(isOpen));
}

function closeMenu() {
  els.navLinks.classList.remove('open');
  els.menuToggle.setAttribute('aria-expanded', 'false');
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

function formatDay(value) {
  if (!value) return '--';
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-CR', { day: '2-digit' }).format(date);
}

function formatMonth(value) {
  if (!value) return '---';
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-CR', { month: 'short' }).format(date);
}

function statusClass(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('confirm') || normalized.includes('complet')) return 'ok';
  if (normalized.includes('cancel')) return 'danger';
  return 'hold';
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHTML(message)}</div>`;
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('visible');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => els.toast.classList.remove('visible'), 3200);
}

function withErrorHandling(handler) {
  return async function wrappedHandler(event) {
    try {
      await handler(event);
    } catch (error) {
      console.error(error);
      showToast(error?.message || 'Ocurrió un error. Revisá la información e intentá de nuevo.');
    }
  };
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[char];
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
