# QR Test

Mini app/PWA en JavaScript vanilla construida con Vite para gestionar acceso a eventos mediante QR. Incluye login, selección de campañas y productos, escaneo QR, búsqueda manual de inscritos, estadísticas y alta manual.

## Requisitos

- Node.js y npm
- Instalar dependencias con:

```bash
npm install
```

## Scripts

- `npm run dev`: arranca el entorno de desarrollo con Vite
- `npm run build`: genera la build de producción
- `npm run preview`: sirve localmente la build generada
- `npm run test`: ejecuta la suite de Vitest
- `npm run test:watch`: ejecuta Vitest en modo interactivo
- `npm run lint`: ejecuta ESLint
- `npm run lint:fix`: aplica fixes automáticos seguros de ESLint

## Estructura del proyecto

- `src/main.js`: ensamblador principal; coordina estado global, listeners, routing, render y wiring entre módulos
- `src/router/*`: parsing de rutas, guards, resolución de datos por ruta y limpieza de estado transitorio de navegación
- `src/scanner/*`: separación del scanner por lifecycle de cámara, flujo de lectura/validación y adaptadores UI del scanner
- `src/services/*`: acceso a datos y lógica de integración con API para campañas, productos, registros, validación y búsqueda
- `src/flows/*`: subflujos de interacción y mutaciones de estado para login, registro, búsqueda y validaciones
- `src/pages/*`: renderizado HTML de pantallas y bloques de página
- `src/ui/*`: helpers de UI transversales que sincronizan regiones concretas del DOM
- `src/notifications/*`: punto central de notificaciones/resultados/overlays según canal
- `src/auth/*`: persistencia de token y utilidades de autenticación
- `src/lib/*`: utilidades de dominio compartidas
- `public/sw.js`: service worker de la PWA

## Flujo general

- `src/main.js` interpreta la ruta actual, aplica guards, resuelve datos necesarios y renderiza la pantalla activa
- `src/router/*` mantiene aislado el routing: rutas soportadas, redirects de auth y carga reusable por ruta
- `src/scanner/scanner-controller.js` gestiona la cámara y el lifecycle de `html5-qrcode`
- `src/scanner/scanner-flow.js` coordina lectura confirmada, validación, refresh del producto y reseteo del ciclo de escaneo
- `src/scanner/scanner-ui.js` encapsula los adaptadores DOM específicos del scanner
- `src/services/*` habla con la API y normaliza respuestas
- `src/flows/*` aplica la lógica de interacción sobre el estado de la app
- `src/pages/*` devuelve el HTML de cada pantalla, sin asumir el control global de navegación

## Calidad y verificación

Antes de cambios importantes conviene ejecutar:

```bash
npm run lint
npm run test
npm run build
```

La expectativa de mantenimiento es que lint, tests y build sigan pasando tras cambios funcionales o refactors relevantes.

## Notas de mantenimiento

- La arquitectura actual ya está en un punto estable y razonablemente modular
- `src/main.js` sigue siendo grande, pero su rol actual como ensamblador/orquestador es intencional
- Evita seguir fragmentando módulos sin una necesidad clara de mantenimiento o de comportamiento
- Prioriza cambios funcionales y correcciones reales sobre más refactor estructural
- Si se toca routing o scanner, intenta preservar las fronteras actuales entre `router/*` y `scanner/*`
