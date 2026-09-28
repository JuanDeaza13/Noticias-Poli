# NEWS POLI - Listado de noticias

Implementación Front-end de la vista **Listado de noticias** para la Entrega Previa 2 del módulo Desarrollo de Front-end.

## Alcance implementado

- Maquetación responsive basada en el mockup suministrado.
- Renderizado dinámico de noticias desde `assets/data/noticias.json`.
- Noticia principal, dos noticias secundarias y sección **Más noticias**.
- Búsqueda por título, descripción, categoría y autor.
- Filtros por categoría.
- Favoritos persistentes con `localStorage`.
- Acceso a **Favoritos** desde el header sin crear un módulo separado: la misma vista filtra las noticias guardadas.
- Hover en navegación, filtros y cards.
- Botón de favorito con estado activo en `#ff8c00`.
- Acción **Ver más** en todas las cards con modal de vista previa.
- Acción **Ver noticia** preparada para integrarse con la futura vista de detalle.
- Navegación mobile y consideraciones básicas de accesibilidad.

## Estructura

```text
poli-news/
├── index.html
├── views/
│   └── noticias.html
├── assets/
│   ├── data/
│   │   └── noticias.json
│   ├── images/
│   │   ├── tecnologia-estudiantes.webp
│   │   ├── turismo-cartagena.webp
│   │   ├── educacion-aula.webp
│   │   ├── comercio-local.webp
│   │   ├── tecnologia-innovacion.webp
│   │   └── educacion-colaborativa.webp
│   ├── js/
│   │   └── noticias.js
│   └── styles/
│       └── noticias.css
├── docs/
│   └── mockups/
│       ├── listado-preview.png
│       ├── news_poli_listado_noticias.svg
│       └── README.md
└── README.md
```

## Cómo ejecutarlo

El navegador debe cargar `noticias.json` mediante HTTP. La forma más sencilla en Visual Studio Code es usar la extensión **Live Server** y abrir `index.html`.

Alternativa desde una terminal ubicada en la carpeta del proyecto:

```bash
python -m http.server 5500
```

Luego abrir:

```text
http://localhost:5500/
```

> Si se abre `views/noticias.html` directamente con `file://`, algunos navegadores bloquearán `fetch()` del JSON por seguridad.

## Datos e imágenes

Las seis imágenes incluidas fueron extraídas del SVG `listado.svg` suministrado como referencia visual y optimizadas a WebP para uso web. Para reemplazar una imagen basta con copiar el nuevo archivo a `assets/images/` y actualizar su ruta en `assets/data/noticias.json`.

## Integración con Detalle

`assets/js/noticias.js` define:

```js
const CONFIG = {
  detailBaseUrl: './detalle.html'
};
```

Los enlaces se generan como:

```text
detalle.html?id=1&slug=tecnologia-transforma-forma-aprender
```

La página de detalle **no está implementada en este proyecto**, porque corresponde a otro módulo del trabajo. Cuando exista, solo debe conservar esa ruta o ajustar `detailBaseUrl`.

## Integración con Home y Contacto

Los elementos **Inicio** y **Contacto** se dejaron como puntos de integración. Mientras esas vistas no existan, muestran un mensaje breve en lugar de navegar a una página inexistente.

## Favoritos

Los IDs de noticias favoritas se guardan en:

```text
localStorage["newsPoliFavorites"]
```

El color activo del corazón es `#ff8c00`.
