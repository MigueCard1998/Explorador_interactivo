# Explorador Rick y Morty

**En producción:** https://exploradorinteractivo1.vercel.app/

![CI](https://github.com/MigueCard1998/Explorador_interactivo/actions/workflows/ci.yml/badge.svg)

Explorador de personajes de Rick and Morty: búsqueda por nombre, filtros por estado y género, detalle en un modal, favoritos que se recuerdan al recargar y una guía de capítulos agrupada por temporada.

- **API:** [The Rick and Morty API](https://rickandmortyapi.com) (`/character` y `/episode`), sin clave.
- **Tecnologías:** HTML semántico, Tailwind CSS, JavaScript con módulos ES, `fetch` con `async/await` y LocalStorage.

## Funciones

- Listado de personajes con "Cargar más" y los tres estados: cargando, error con reintento y vacío.
- Búsqueda por nombre y filtros por estado y género.
- Vista de detalle de cada personaje.
- Favoritos persistentes con LocalStorage y vista propia.
- Guía de capítulos por temporada, con los personajes de cada episodio.

## Cómo correrlo en tu computador

```bash
git clone https://github.com/MigueCard1998/Explorador_interactivo.git
cd Explorador_interactivo
npm install
npm run dev
```

Deja esa terminal abierta: genera `css/tailwind.css` y lo actualiza al guardar. Abre `index.html` con Live Server, porque los módulos ES no funcionan con doble clic.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Compila Tailwind y lo recompila cada vez que guardas |
| `npm run build` | Compila Tailwind una vez, minificado (lo usan el CI y Vercel) |
| `npm run validar` | Valida `index.html` con html-validate |

## Estructura

```text
index.html
src/entrada.css       # entrada de Tailwind
css/tailwind.css      # generado por npm run dev / build (no se sube a Git)
js/app.js             # interfaz: estado, DOM y eventos
js/api.js             # fetch a la API y manejo de errores
js/logica.js          # funciones puras: filtrar, agrupar, contar
js/favoritos.js       # LocalStorage
```

## Flujo de trabajo

Cada cambio entra a `main` por una rama y un Pull Request. GitHub Actions compila y valida cada PR, y Vercel publica una preview por PR y la versión de producción con cada merge a `main`.