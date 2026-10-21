// js/api.js
// Semana 8: datos.js ya NO existe. Esta es la única fuente de personajes:
// peticiones reales a la Rick and Morty API con fetch().

const URL_BASE = "https://rickandmortyapi.com/api/character";

// pedirJSON(): el envoltorio de fetch que usan todas las demás funciones.
// Comprueba `respuesta.ok` ANTES de intentar leer el cuerpo — si el servidor
// respondió con un 404 o un 500, fetch() no lanza error por sí solo, así que
// hay que revisarlo a mano y lanzarlo nosotros.
async function pedirJSON(url) {
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status}: no se pudo cargar ${url}`);
  }

  return respuesta.json();
}

// obtenerPersonajes(url): trae UNA página de personajes.
// Por defecto pide la primera página; para "Cargar más" se le pasa
// directamente la URL que vino en data.info.next (ver docs/notas-api.md).
// Cada elemento de results ya trae todo lo que necesita la tarjeta Y el
// modal de detalle, así que no hace falta un segundo fetch por personaje.
export async function obtenerPersonajes(url = URL_BASE) {
  const data = await pedirJSON(url);
  return {
    personajes: data.results,
    siguientePagina: data.info.next, // URL lista para usar, o null si es la última página
  };
}

// obtenerPersonajesPorIds(ids): para la vista de Favoritos.
// En LocalStorage solo guardamos ids (números), no los objetos completos —
// si guardáramos los objetos, un personaje favorito quedaría "congelado" con
// datos viejos para siempre. La Rick and Morty API acepta varios ids
// separados por coma en la misma URL y los devuelve en un solo fetch.
// Con un solo id, la API devuelve un objeto suelto (no un array), así que
// normalizamos siempre a array para que quien llama no tenga que pensar en eso.
export async function obtenerPersonajesPorIds(ids) {
  if (ids.length === 0) return [];

  const data = await pedirJSON(`${URL_BASE}/${ids.join(",")}`);
  return Array.isArray(data) ? data : [data];
}