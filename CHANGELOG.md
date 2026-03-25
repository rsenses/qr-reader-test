# CHANGELOG

Todos los cambios relevantes de este proyecto se documentaran en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Changed
- Documentacion tecnica inicial del proyecto en `README.md`.
- Base de changelog creada para registrar cambios futuros de forma consistente.

## [0.1.0] - 2026-03-25

### Added
- Suite de tests con Vitest para utilidades de dominio, router, scanner, flows, servicios y notificaciones.
- Scripts de calidad para test y lint dentro del proyecto.
- Soporte de modo agregado por campana mediante el producto sintetico `TODOS`.

### Changed
- Reorganizacion de la aplicacion desde un `main.js` monolitico hacia una arquitectura modular por responsabilidades.
- Separacion del routing en `src/router/*` para parsing, guards, resolucion de rutas y estado transitorio de navegacion.
- Separacion del scanner en `src/scanner/*` para lifecycle de camara, flujo de lectura/validacion y adaptadores UI.
- Extraccion de `services/*`, `flows/*`, `pages/*`, `ui/*`, `notifications/*`, `auth/*` y `lib/*` para clarificar responsabilidades.
- Estabilizacion final de `src/main.js` como punto de ensamblaje y orquestacion de la app.

### Fixed
- Correccion de regresiones de carga de registros, busqueda y rutas de producto durante el refactor.
- Manejo mas tolerante de respuestas de API con formas distintas y de respuestas HTML inesperadas.
- Limpieza final de errores de lint y ajuste de configuracion de ESLint, incluyendo exclusion de `dist/**`.

### Removed
- Eliminacion de codigo muerto y restos del scaffold inicial que ya no aportaban valor.
