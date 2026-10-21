// js/app.js  (type="module")
// Semana 8: el único archivo que toca el DOM. Conecta api.js (fetch real),
// logica.js (filtrar, sin DOM) y favoritos.js (LocalStorage). Aquí viven
// cargar(), render() y los tres estados: cargando / error / datos (vacío
// incluido) — nunca una pantalla en blanco.

import { obtenerPersonajes, obtenerPersonajesPorIds } from "./api.js";
import { filtrarPersonajes, textoContador } from "./logica.js";
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

const modalFondo = document.getElementById("modal-fondo");
const modalTitulo = document.getElementById("modal-titulo");
const modalCuerpo = document.getElementById("modal-cuerpo");
const botonCerrarModal = document.getElementById("modal-cerrar");

const ESTADOS = { Alive: "Vivo", Dead: "Muerto", unknown: "Desconocido" };
const COLOR_ESTADO = { Alive: "bg-lime-400", Dead: "bg-red-500", unknown: "bg-slate-500" };

// --- Estado de la app (en memoria, no en el DOM) ---
let vista = "inicio"; // "inicio" | "favoritos"
let personajesCargados = []; // acumula páginas en la vista Inicio
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

function crearTarjeta(personaje) {
  const articulo = document.createElement("article");
  articulo.className =
    "relative flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg";
  articulo.dataset.id = personaje.id;

  const colorEstado = COLOR_ESTADO[personaje.status] ?? COLOR_ESTADO.unknown;
  const estadoTexto = ESTADOS[personaje.status] ?? personaje.status;
  const marcado = esFavorito(personaje.id);

  articulo.innerHTML = `
    <button type="button" data-accion="favorito" aria-pressed="${marcado}"
            aria-label="${marcado ? "Quitar de favoritos" : "Agregar a favoritos"}"
            class="absolute right-3 top-3 text-xl leading-none drop-shadow ${marcado ? "text-pink-500" : "text-slate-400 hover:text-pink-400"}">
      ${marcado ? "♥" : "♡"}
    </button>
    <img src="${personaje.image}" alt="${personaje.name}, personaje de Rick y Morty"
         class="aspect-square w-full rounded-lg object-cover">
    <h3 class="truncate pr-6 text-base font-bold text-slate-100">${personaje.name}</h3>
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
  else cargarFavoritosVista();
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
// Cambiar de vista (Inicio / Favoritos)
// =====================================================================
function cambiarVista(nuevaVista) {
  vista = nuevaVista;

  const esInicio = vista === "inicio";
  enlaceInicio.setAttribute("aria-current", esInicio ? "page" : "false");
  enlaceFavoritos.setAttribute("aria-current", esInicio ? "false" : "page");

  panelFiltros.hidden = !esInicio;          // los filtros solo aplican a Inicio
  tituloVista.textContent = esInicio ? "Personajes" : "Tus favoritos";
  botonCargarMas.hidden = true;             // Favoritos no pagina

  if (esInicio) cargarInicio();
  else cargarFavoritosVista();
}

enlaceInicio.addEventListener("click", (evento) => {
  evento.preventDefault();
  cambiarVista("inicio");
});

enlaceFavoritos.addEventListener("click", (evento) => {
  evento.preventDefault();
  cambiarVista("favoritos");
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
      botonFavorito.className = `absolute right-3 top-3 text-xl leading-none drop-shadow ${
        quedaMarcado ? "text-pink-500" : "text-slate-400 hover:text-pink-400"
      }`;
    }
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
         class="mb-4 aspect-square w-full rounded-xl object-cover">
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

// --- Primer pintado al cargar la página ---
cargarInicio();