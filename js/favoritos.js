// js/favoritos.js
// Semana 8, paso 5: favoritos persistentes con LocalStorage.
// Clave propia (namespaced) para no chocar con otras apps que compartan
// el mismo navegador/dominio: "tuapp:favoritos".

const CLAVE = "tuapp:favoritos";

// Lee el array de ids guardado en LocalStorage. Si no hay nada, o si lo que
// hay es basura (alguien tocó el valor a mano en DevTools), devolvemos []
// en vez de dejar que la app se rompa — es la misma filosofía de "nunca una
// pantalla en blanco" aplicada a datos guardados, no solo a la red.
export function obtenerFavoritos() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    const lista = JSON.parse(guardado);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function guardarFavoritos(lista) {
  localStorage.setItem(CLAVE, JSON.stringify(lista));
}

export function esFavorito(id) {
  return obtenerFavoritos().includes(id);
}

// Si el id ya estaba, lo saca; si no estaba, lo agrega. Devuelve el nuevo
// estado (true = quedó como favorito) para que quien llama sepa cómo pintar
// el corazón sin tener que volver a preguntar.
export function alternarFavorito(id) {
  const favoritos = obtenerFavoritos();
  const index = favoritos.indexOf(id);

  if (index === -1) {
    favoritos.push(id);
    guardarFavoritos(favoritos);
    return true;
  }

  favoritos.splice(index, 1);
  guardarFavoritos(favoritos);
  return false;
}