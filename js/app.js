// js/app.js  (type="module")
// Semana 8: el único archivo que toca el DOM. Conecta api.js (fetch real),
// logica.js (filtrar, sin DOM) y favoritos.js (LocalStorage). Aquí viven
// cargar(), render() y los tres estados: cargando / error / datos (vacío
// incluido) — nunca una pantalla en blanco.

import { obtenerPersonajes, obtenerPersonajesPorIds, obtenerEpisodios } from "./api.js";
import { filtrarPersonajes, textoContador, agruparPorTemporada, idsDePersonajes } from "./logica.js";
import { obtenerFavoritos, esFavorito, alternarFavorito } from "./favoritos.js";

// --- Elementos del DOM ---
const tituloVista = document.getElementById("titulo-vista");
const contadorTexto = document.getElementById("contador");
const panelFiltros = document.getElementById("panel-filtros");
const contenedorResultados = document.getElementById("resultados");

const estadoCargando = document.getElementById("estado-cargando");
const estadoError = document.getElementById("estado-error");
const mensajeError = document.getElementById("mensaje-error");
const botonReintentar = document.getElementById("boton-reintentar");
const estadoVacio = document.getElementById("estado-vacio");

const botonCargarMas = document.getElementById("boton-cargar-mas");

const inputBuscar = document.getElementById("buscar");
const selectEstado = document.getElementById("filtro-estado");
const selectGenero = document.getElementById("filtro-genero");

const enlaceInicio = document.getElementById("enlace-inicio");
const enlaceFavoritos = document.getElementById("enlace-favoritos");
const enlaceCapitulos = document.getElementById("enlace-capitulos");

const modalFondo = document.getElementById("modal-fondo");
const modalTitulo = document.getElementById("modal-titulo");
const modalCuerpo = document.getElementById("modal-cuerpo");
const botonCerrarModal = document.getElementById("modal-cerrar");

const ESTADOS = { Alive: "Vivo", Dead: "Muerto", unknown: "Desconocido" };
const COLOR_ESTADO = { Alive: "bg-lime-400", Dead: "bg-red-500", unknown: "bg-slate-500" };
const TITULOS = { inicio: "Personajes", favoritos: "Tus favoritos", capitulos: "Guía de capítulos" };

// --- Estado de la app (en memoria, no en el DOM) ---
let vista = "inicio"; // "inicio" | "favoritos"
let personajesCargados = []; // acumula páginas en la vista Inicio
let episodiosCargados = []; // se piden una sola vez y se reutilizan
let siguientePaginaURL = null;

// =====================================================================
// Los tres estados: cargando / error / vacío. Se usan en las dos vistas.
// =====================================================================
function mostrarCargando() {
  estadoCargando.hidden = false;
  estadoError.hidden = true;
  estadoVacio.hidden = true;
  contenedorResultados.hidden = true;
}

function mostrarError(mensaje) {
  estadoCargando.hidden = true;
  estadoError.hidden = false;
  estadoVacio.hidden = true;
  contenedorResultados.hidden = true;
  mensajeError.textContent = mensaje;
}

function mostrarVacio(mensaje) {
  estadoCargando.hidden = true;
  estadoError.hidden = true;
  estadoVacio.hidden = false;
  contenedorResultados.hidden = true;
  estadoVacio.textContent = mensaje;
}

function mostrarDatos() {
  estadoCargando.hidden = true;
  estadoError.hidden = true;
  estadoVacio.hidden = true;
  contenedorResultados.hidden = false;
}

// =====================================================================
// render(): pinta una lista de personajes ya decidida (filtrada o no).
// No hace fetch ni filtra — solo construye HTML a partir de datos.
// =====================================================================
function render(lista, mensajeVacio) {
  if (lista.length === 0) {
    mostrarVacio(mensajeVacio);
    contadorTexto.textContent = "";
    return;
  }

  mostrarDatos();
  contenedorResultados.innerHTML = "";
  lista.forEach((personaje) => contenedorResultados.appendChild(crearTarjeta(personaje)));
  contadorTexto.textContent = textoContador(lista.length);
}

function claseFavorito(marcado) {
  const base =
    "absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full " +
    "bg-slate-900/60 text-lg leading-none backdrop-blur-sm transition-colors";
  return `${base} ${marcado ? "text-pink-500" : "text-slate-200 hover:text-pink-400"}`;
}

function crearTarjeta(personaje) {
  const articulo = document.createElement("article");
  articulo.className =
    "group relative flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg " +
    "transition duration-200 ease-out " +
    "hover:-translate-y-1 hover:border-lime-400/60 hover:shadow-xl hover:shadow-lime-400/10";
  articulo.dataset.id = personaje.id;

  const colorEstado = COLOR_ESTADO[personaje.status] ?? COLOR_ESTADO.unknown;
  const estadoTexto = ESTADOS[personaje.status] ?? personaje.status;
  const marcado = esFavorito(personaje.id);

  articulo.innerHTML = `
    <div class="relative overflow-hidden rounded-lg">
      <img src="${personaje.image}" alt="${personaje.name}, personaje de Rick y Morty"
           class="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105">
      <button type="button" data-accion="favorito" aria-pressed="${marcado}"
              aria-label="${marcado ? "Quitar de favoritos" : "Agregar a favoritos"}"
              class="${claseFavorito(marcado)}">
        ${marcado ? "♥" : "♡"}
      </button>
    </div>
    <h3 class="truncate text-base font-bold text-slate-100">${personaje.name}</h3>
    <p class="flex items-center gap-2 text-sm text-slate-400">
      <span class="h-2.5 w-2.5 rounded-full ${colorEstado}"></span>
      ${estadoTexto} · ${personaje.species}
    </p>
    <button type="button" data-accion="ver-detalle"
            class="mt-auto rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-lime-300">
      Ver detalle
    </button>
  `;

  return articulo;
}

// =====================================================================
// Vista Inicio: fetch real + los tres estados + filtros + "Cargar más"
// =====================================================================
function aplicarFiltrosYRender() {
  const filtrados = filtrarPersonajes(personajesCargados, {
    texto: inputBuscar.value,
    estado: selectEstado.value,
    genero: selectGenero.value,
  });
  render(filtrados, "No encontramos personajes con esos filtros. Prueba cambiando la búsqueda.");
}

async function cargarInicio() {
  mostrarCargando();
  botonCargarMas.hidden = true;

  try {
    const { personajes, siguientePagina } = await obtenerPersonajes();
    personajesCargados = personajes;
    siguientePaginaURL = siguientePagina;
    aplicarFiltrosYRender();
    botonCargarMas.hidden = siguientePaginaURL === null;
  } catch (error) {
    mostrarError("No pudimos cargar los personajes. Revisa tu conexión e inténtalo de nuevo.");
    console.error(error);
  }
}

async function cargarMas() {
  if (!siguientePaginaURL) return;

  botonCargarMas.disabled = true;
  botonCargarMas.textContent = "Cargando...";

  try {
    const { personajes, siguientePagina } = await obtenerPersonajes(siguientePaginaURL);
    personajesCargados = [...personajesCargados, ...personajes];
    siguientePaginaURL = siguientePagina;
    aplicarFiltrosYRender();
    botonCargarMas.hidden = siguientePaginaURL === null;
  } catch (error) {
    // No reemplazamos toda la pantalla por un error: ya había tarjetas
    // cargadas y visibles. Basta con avisar y dejar el botón listo para reintentar.
    alert("No pudimos cargar más personajes. Inténtalo de nuevo.");
    console.error(error);
  } finally {
    botonCargarMas.disabled = false;
    botonCargarMas.textContent = "Cargar más";
  }
}

botonCargarMas.addEventListener("click", cargarMas);
botonReintentar.addEventListener("click", () => {
  if (vista === "inicio") cargarInicio();
  else if (vista === "favoritos") cargarFavoritosVista();
  else cargarCapitulos();
});

inputBuscar.addEventListener("input", aplicarFiltrosYRender);
selectEstado.addEventListener("change", aplicarFiltrosYRender);
selectGenero.addEventListener("change", aplicarFiltrosYRender);

// =====================================================================
// Vista Favoritos: pide por id a la API (no depende de lo ya cargado en Inicio)
// =====================================================================
async function cargarFavoritosVista() {
  const ids = obtenerFavoritos();

  if (ids.length === 0) {
    mostrarVacio("Todavía no tienes favoritos. Marca el corazón ♡ de un personaje para guardarlo aquí.");
    contadorTexto.textContent = "";
    return;
  }

  mostrarCargando();
  try {
    const personajes = await obtenerPersonajesPorIds(ids);
    render(personajes, "Todavía no tienes favoritos. Marca el corazón ♡ de un personaje para guardarlo aquí.");
  } catch (error) {
    mostrarError("No pudimos cargar tus favoritos. Revisa tu conexión e inténtalo de nuevo.");
    console.error(error);
  }
}

// =====================================================================
// Vista Capítulos
// =====================================================================
function formatearFecha(texto) {
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? texto : fecha.toLocaleDateString("es-CO", { dateStyle: "long" });
}

function crearTarjetaEpisodio(episodio) {
  const articulo = document.createElement("article");
  articulo.className =
    "flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg " +
    "transition duration-200 ease-out hover:-translate-y-1 hover:border-lime-400/60";
  articulo.dataset.episodio = episodio.id;

  articulo.innerHTML = `
    <span class="w-fit rounded-full bg-lime-400/10 px-2.5 py-0.5 text-xs font-semibold text-lime-400">${episodio.episode}</span>
    <h4 class="text-base font-bold text-slate-100">${episodio.name}</h4>
    <p class="text-sm text-slate-400">Estreno: ${formatearFecha(episodio.air_date)}</p>
    <p class="text-sm text-slate-400">${episodio.characters.length} personajes</p>
    <button type="button" data-accion="ver-episodio"
            class="mt-auto rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-lime-300">
      Ver personajes
    </button>
  `;
  return articulo;
}

function renderCapitulos() {
  mostrarDatos();
  contenedorResultados.innerHTML = "";

  agruparPorTemporada(episodiosCargados).forEach(({ temporada, episodios }) => {
    const titulo = document.createElement("h3");
    titulo.className = "col-span-full mt-4 border-b border-slate-800 pb-2 text-lg font-bold text-lime-400 first:mt-0";
    titulo.textContent = `Temporada ${temporada}`;
    contenedorResultados.appendChild(titulo);

    episodios.forEach((episodio) => contenedorResultados.appendChild(crearTarjetaEpisodio(episodio)));
  });

  contadorTexto.textContent = `${episodiosCargados.length} capítulos`;
}

async function cargarCapitulos() {
  mostrarCargando();
  try {
    if (episodiosCargados.length === 0) episodiosCargados = await obtenerEpisodios();
    if (vista !== "capitulos") return; // el usuario cambió de vista mientras cargaba
    renderCapitulos();
  } catch (error) {
    mostrarError("No pudimos cargar los capítulos. Revisa tu conexión e inténtalo de nuevo.");
    console.error(error);
  }
}

async function abrirModalEpisodio(episodio) {
  modalTitulo.textContent = `${episodio.episode} · ${episodio.name}`;
  modalCuerpo.innerHTML = `<p class="py-6 text-center text-slate-400">Cargando personajes…</p>`;
  modalFondo.hidden = false;

  const botonVolver = `
    <button type="button" data-accion="cerrar-modal"
            class="mt-5 w-full rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-lime-300">
      Volver
    </button>`;

  try {
    const personajes = await obtenerPersonajesPorIds(idsDePersonajes(episodio));
    modalCuerpo.innerHTML = `
      <ul class="grid grid-cols-3 gap-3">
        ${personajes.map((p) => `
          <li class="text-center text-xs text-slate-300">
            <img src="${p.image}" alt="${p.name}" loading="lazy"
                 class="mb-1 aspect-square w-full rounded-lg object-cover">
            ${p.name}
          </li>`).join("")}
      </ul>
      ${botonVolver}`;
  } catch (error) {
    modalCuerpo.innerHTML = `<p class="py-6 text-center text-rose-400">No pudimos cargar los personajes.</p>${botonVolver}`;
    console.error(error);
  }
}
// =====================================================================
// Cambiar de vista (Inicio / Favoritos)
// =====================================================================
function cambiarVista(nuevaVista) {
  vista = nuevaVista;

  enlaceInicio.setAttribute("aria-current", vista === "inicio" ? "page" : "false");
  enlaceFavoritos.setAttribute("aria-current", vista === "favoritos" ? "page" : "false");
  enlaceCapitulos.setAttribute("aria-current", vista === "capitulos" ? "page" : "false");

  panelFiltros.hidden = vista !== "inicio";   // los filtros solo aplican a Inicio
  tituloVista.textContent = TITULOS[vista];
  botonCargarMas.hidden = true;               // solo Inicio pagina

  if (vista === "inicio") cargarInicio();
  else if (vista === "favoritos") cargarFavoritosVista();
  else cargarCapitulos();
}

enlaceInicio.addEventListener("click", (evento) => {
  evento.preventDefault();
  cambiarVista("inicio");
});

enlaceFavoritos.addEventListener("click", (evento) => {
  evento.preventDefault();
  cambiarVista("favoritos");
});

enlaceCapitulos.addEventListener("click", (evento) => {
  evento.preventDefault();
  cambiarVista("capitulos");
});

// =====================================================================
// Delegación de eventos en la grilla: un solo listener para "Ver detalle"
// Y para el corazón de favoritos, en vez de uno por cada botón de cada
// tarjeta (que además se destruyen y se recrean en cada render).
// =====================================================================
contenedorResultados.addEventListener("click", (evento) => {
  const botonFavorito = evento.target.closest('[data-accion="favorito"]');
  if (botonFavorito) {
    const tarjeta = botonFavorito.closest("article");
    const id = Number(tarjeta.dataset.id);
    const quedaMarcado = alternarFavorito(id);

    if (vista === "favoritos" && !quedaMarcado) {
      // En la vista Favoritos, desmarcar hace que la tarjeta desaparezca.
      cargarFavoritosVista();
    } else {
      botonFavorito.textContent = quedaMarcado ? "♥" : "♡";
      botonFavorito.setAttribute("aria-pressed", String(quedaMarcado));
      botonFavorito.setAttribute("aria-label", quedaMarcado ? "Quitar de favoritos" : "Agregar a favoritos");
      botonFavorito.className = claseFavorito(quedaMarcado);
    }
    return;
  }

  const botonEpisodio = evento.target.closest('[data-accion="ver-episodio"]');
  if (botonEpisodio) {
    const id = Number(botonEpisodio.closest("article").dataset.episodio);
    abrirModalEpisodio(episodiosCargados.find((e) => e.id === id));
    return;
  }

  const botonDetalle = evento.target.closest('[data-accion="ver-detalle"]');
  if (botonDetalle) {
    const id = Number(botonDetalle.closest("article").dataset.id);
    const fuente = vista === "inicio" ? personajesCargados : null;
    const personaje = fuente
      ? fuente.find((p) => p.id === id)
      : null;

    if (personaje) {
      abrirModal(personaje);
    } else {
      // Vista Favoritos: no guardamos la lista cargada en una variable global,
      // así que volvemos a pedir ese único personaje por su id.
      obtenerPersonajesPorIds([id]).then(([p]) => abrirModal(p));
    }
  }
});

function abrirModal(personaje) {
  modalTitulo.textContent = personaje.name;
  modalCuerpo.innerHTML = `
    <img src="${personaje.image}" alt="${personaje.name}"
         class="mx-auto mb-4 aspect-square w-44 rounded-xl object-cover">
    <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <dt class="font-semibold text-slate-400">Estado</dt>
      <dd class="text-slate-100">${ESTADOS[personaje.status] ?? personaje.status}</dd>
      <dt class="font-semibold text-slate-400">Especie</dt>
      <dd class="text-slate-100">${personaje.species}</dd>
      <dt class="font-semibold text-slate-400">Género</dt>
      <dd class="text-slate-100">${personaje.gender}</dd>
      <dt class="font-semibold text-slate-400">Origen</dt>
      <dd class="text-slate-100">${personaje.origin.name}</dd>
      <dt class="font-semibold text-slate-400">Última ubicación</dt>
      <dd class="text-slate-100">${personaje.location.name}</dd>
    </dl>
    <button type="button" data-accion="cerrar-modal"
            class="mt-5 w-full rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-lime-300">
      Volver
    </button>
  `;
  modalFondo.hidden = false;
}

function cerrarModal() {
  modalFondo.hidden = true;
}

botonCerrarModal.addEventListener("click", cerrarModal);
modalFondo.addEventListener("click", (evento) => {
  if (evento.target === modalFondo) cerrarModal();
});
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && !modalFondo.hidden) cerrarModal();
});

modalCuerpo.addEventListener("click", (evento) => {
  if (evento.target.closest('[data-accion="cerrar-modal"]')) cerrarModal();
});


// --- Primer pintado al cargar la página ---
cargarInicio();
