// js/logica.js
// Semana 7: lógica PURA. Ninguna línea de este archivo toca `document`
// ni el DOM — solo recibe datos, los transforma y devuelve datos.
// Eso la hace fácil de probar a mano en la consola, sin necesidad de HTML:
//   filtrarPersonajes(personajes, { texto: "rick" })

// Filtra una lista de personajes por nombre, estado y género a la vez.
// Los tres criterios son opcionales: una cadena vacía ("") significa "no filtrar por esto".
export function filtrarPersonajes(lista, { texto = "", estado = "", genero = "" } = {}) {
  const textoNormalizado = texto.trim().toLowerCase();

  return lista.filter((personaje) => {
    const coincideNombre = personaje.name.toLowerCase().includes(textoNormalizado);
    const coincideEstado = estado === "" || personaje.status === estado;
    const coincideGenero = genero === "" || personaje.gender === genero;
    return coincideNombre && coincideEstado && coincideGenero;
  });
}

// Cuenta cuántos personajes hay en una lista. Parece trivial, pero vivir aquí
// (y no inline en app.js) es lo que permite probarla sola y reutilizarla.
export function contarPersonajes(lista) {
  return lista.length;
}

// Arma el texto del contador ("12 personajes" / "1 personaje") en singular o
// plural. Es texto, no DOM: por eso también vive en logica.js y no en app.js.
export function textoContador(cantidad) {
  return `${cantidad} personaje${cantidad === 1 ? "" : "s"}`;
}