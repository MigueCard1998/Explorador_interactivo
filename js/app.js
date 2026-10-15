// js/app.js  (type="module")
// Semana 7: el único archivo que toca el DOM. Importa los datos "crudos" de
// datos.js y las funciones puras de logica.js; aquí solo se arma el HTML,
// se escuchan eventos y se decide qué mostrar.

import { personajes } from "./datos.js";
import { filtrarPersonajes, contarPersonajes, textoContador } from "./logica.js";

// --- Elementos del DOM ---
const contenedorResultados = document.getElementById("resultados");
const mensajeSinResultados = document.getElementById("sin-resultados");
const contadorTexto = document.getElementById("contador");

const inputBuscar = document.getElementById("buscar");
const selectEstado = document.getElementById("filtro-estado");
const selectGenero = document.getElementById("filtro-genero");

const modalFondo = document.getElementById("modal-fondo");
const modalTitulo = document.getElementById("modal-titulo");
const modalCuerpo = document.getElementById("modal-cuerpo");
const botonCerrarModal = document.getElementById("modal-cerrar");

const ESTADOS = { Alive: "Vivo", Dead: "Muerto", unknown: "Desconocido" };
const COLOR_ESTADO = { Alive: "bg-lime-400", Dead: "bg-red-500", unknown: "bg-slate-500" };

// --- render(): construye el HTML de los resultados a partir de un array ---
function render(lista) {
  contenedorResultados.innerHTML = "";

  const hayResultados = lista.length > 0;
  mensajeSinResultados.hidden = hayResultados;     // estado vacío
  contenedorResultados.hidden = !hayResultados;

  lista.forEach((personaje) => {
    contenedorResultados.appendChild(crearTarjeta(personaje));
  });

  contadorTexto.textContent = textoContador(contarPersonajes(lista));
}

function crearTarjeta(personaje) {
  const articulo = document.createElement("article");
  articulo.className =
    "flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg";
  articulo.dataset.id = personaje.id;

  const colorEstado = COLOR_ESTADO[personaje.status] ?? COLOR_ESTADO.unknown;
  const estadoTexto = ESTADOS[personaje.status] ?? personaje.status;

  articulo.innerHTML = `
    <img src="${personaje.image}" alt="${personaje.name}, personaje de Rick y Morty"
         class="aspect-square w-full rounded-lg object-cover">
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

// --- Buscador + filtros: leen los controles, llaman a logica.js, vuelven a render ---
function actualizarResultados() {
  const filtrados = filtrarPersonajes(personajes, {
    texto: inputBuscar.value,
    estado: selectEstado.value,
    genero: selectGenero.value,
  });
  render(filtrados);
}

inputBuscar.addEventListener("input", actualizarResultados);
selectEstado.addEventListener("change", actualizarResultados);
selectGenero.addEventListener("change", actualizarResultados);

// --- Modal con delegación de eventos ---
// Un solo listener en el contenedor padre, en vez de uno por cada botón
// "Ver detalle" (que además se destruyen y se recrean cada vez que filtramos).
contenedorResultados.addEventListener("click", (evento) => {
  const boton = evento.target.closest('[data-accion="ver-detalle"]');
  if (!boton) return;

  const id = Number(boton.closest("article").dataset.id);
  const personaje = personajes.find((p) => p.id === id);
  abrirModal(personaje);
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
  if (evento.target === modalFondo) cerrarModal(); // clic en el fondo, no en la caja
});
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && !modalFondo.hidden) cerrarModal();
});

// --- Primer pintado al cargar la página ---
render(personajes);
