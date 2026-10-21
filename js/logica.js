// js/logica.js
// Lógica PURA. Ninguna línea de este archivo toca `document` ni el DOM, ni
// hace fetch — solo recibe datos ya cargados y los transforma. Por eso se
// puede probar sola en la consola: filtrarPersonajes(lista, { texto: "rick" })

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

export function contarPersonajes(lista) {
  return lista.length;
}

export function textoContador(cantidad) {
  return `${cantidad} personaje${cantidad === 1 ? "" : "s"}`;
}