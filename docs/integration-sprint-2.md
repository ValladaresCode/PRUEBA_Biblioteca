# Informe de Integración — Sprint 2 (S2-10)

- **Fecha:** 2026-07-15
- **Responsable de integración:** Integrador principal / Scrum Master (cierre del Sprint 2)
- **Rama de integración:** `claude/sprint-2-integration-closure-fej30r` (partiendo de `main`, commit `e0abd67`)
- **Node.js:** v22.22.2 · **pnpm:** 10.29.3
- **Veredicto:** **APROBADO CON OBSERVACIONES**

---

## 1. Ramas / PR integrados en `main` antes de esta tarea

Todas las features del Sprint 2 ya estaban fusionadas en `main` mediante PR (verificado en el historial de commits):

| Tarea | Contribución | Commit(s) | Autor |
| --- | --- | --- | --- |
| S2-01 | Middleware `validateJWT` de Library | `e662ca0` | KennXxX |
| S2-02 | CRUD de Books + validaciones | `51aad38`, `993d6c2` | Marcos-JG / KennXxX |
| S2-03 | Loans y Returns (modelo, servicio, rutas) | `fcf45b1` | ValladaresCode |
| S2-04 | Middleware `validateJWT` de Statistics | (incluido en Statistics) | — |
| S2-05 | `GET /statistics` (cálculo Books+Loans) | `8353608` | ZimriJahdai |
| S2-06 | Cliente HTTP autenticado (Axios + JWT) | `9ffdeaa` | ZimriJahdai |
| S2-07 | UI de Books (`BooksPage`) | `0840b4b` | SuarezGil |
| S2-08 | UI de Loans (`LoansPage`) | `ba47d7d` | ValladaresCode |
| S2-09 | Componente Statistics | `fce7afd` | Marcos-JG |

PR de merge a `main`: `#8` (ft/roger), `#9` (ft/suarez), `#10` (ft/kenny), `#11` (ft/zimri), `#12` (ft/marcos).

> Cada reporte se comparó contra su diff real. Las contribuciones existen y son funcionales a nivel de código; el trabajo de S2-10 fue **conectarlas** (montaje de routers, protección de rutas y navegación), no reimplementarlas.

---

## 2. Cambios de integración aplicados (correcciones mínimas)

Se preservó la autoría de cada módulo. Solo se corrigieron incompatibilidades reales de montaje/protección:

### Backend — Library

1. **`service-library/configs/app.js`** *(archivo reservado de integración)*
   - Se importan y montan los routers de Loans y Returns:
     `app.use('/api/v1/loans', loanRoutes)` y `app.use('/api/v1/returns', returnRoutes)`.
   - Se importa `loan.model.js` para registrarlo en Mongoose.
   - Se conservan health, 404 y error handler. Sin prefijos duplicados.

2. **`service-library/src/books/book.routes.js`** *(corrección mínima justificada)*
   - **Incompatibilidad real:** el import dinámico apuntaba a `'../middlewares/validate-JWT.js'` (ruta y mayúsculas inexistentes: el archivo real es `../../middlewares/validate-jwt.js`). En Linux, ese import fallaba y caía silenciosamente a un no-op `(req,res,next)=>next()`, dejando **POST/PUT/DELETE de Books sin protección JWT**.
   - **Corrección:** import estático de `validateJWT` y `requireRole` desde `../../middlewares/`. Se aplica `validateJWT + requireRole('LIBRARIAN_ROLE')` a las tres mutaciones. `GET /books` permanece público. No se tocó ninguna lógica del controller.

### Backend — Statistics

3. **`service-statistics/src/statistics/statistics.routes.js`** *(corrección mínima justificada)*
   - Se aplica `validateJWT` **solo** a `GET /statistics`. `GET /summary` permanece público (contrato Sprint 1).
   - Statistics ya reenvía el header `Authorization` a Library (`statistics.service.js`) y responde `503` si Library cae; no se modificó esa lógica.

### Frontend

4. **`frontend/src/features/books/booksClient.js`** *(corrección mínima justificada)*
   - **Incompatibilidad real:** reexportaba desde `books.api.mock.js` (datos simulados). La UI de Books consumía un **mock**, no el Servicio Library.
   - **Corrección:** reexporta `listBooks/createBook/updateBook/deleteBook` desde `../../api/library.api.js` (cliente real S2-06 con JWT) y `getApiErrorMessage` desde `../../api/api-error.js`.

5. **`frontend/src/features/statistics/StatisticsPanel.jsx`** *(corrección mínima justificada)*
   - **Incompatibilidad real:** importaba `getStatistics` y `getApiErrorMessage` desde `../../api/library.api.js`, que no los exporta (imports `undefined` → el panel fallaba en runtime).
   - **Corrección:** `getStatistics` desde `../../api/statistics.api.js` y `getApiErrorMessage` desde `../../api/api-error.js`.

6. **`frontend/src/router/index.jsx`** *(archivo reservado)* — rutas protegidas `/app/books` y `/app/loans`.

7. **`frontend/src/layouts/AppLayout.jsx`** *(archivo reservado)* — navegación (Resumen, Libros, Préstamos) con `NavLink`; se conserva el logout.

8. **`frontend/src/pages/AppPage.jsx`** *(archivo reservado)* — integra `StatisticsPanel` en la pantalla "Resumen" y añade accesos directos a Libros y Préstamos. No se tocaron Login/Register.

### Raíz / scripts

9. **`package.json`** *(raíz, reservado)* — script `smoke:sprint2`.
10. **`scripts/smoke-sprint-2.mjs`** *(nuevo)* — smoke de 22 comprobaciones contra servicios reales.

---

## 3. Variables confirmadas

- Puertos: Auth 4000, Library 4001, Statistics 4002, Frontend 5173. ✅
- URLs de API del frontend correctas (`.env.example`). ✅
- `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` idénticos en Auth, Library y Statistics (documentados en los `.env.example`; validado en runtime: el JWT emitido por Auth **verifica** con el mismo secreto/issuer/audience que usan los middlewares de Library y Statistics). ✅
- No hay secretos reales versionados; solo `.env.example`. Los `.env` reales están ignorados por Git. ✅

---

## 4. Infraestructura utilizada en esta verificación

| Componente | Estado en este entorno |
| --- | --- |
| PostgreSQL 16 (Auth) | ✅ Real (binario local `initdb`/`pg_ctl`, 127.0.0.1:5432, base `biblioteca_auth`) |
| Auth (4000) | ✅ Ejecutado contra PostgreSQL real |
| Statistics (4002) | ✅ Ejecutado real |
| MongoDB (Library) | ❌ **No provisionable en este entorno** — el registro de Docker (`production.cloudfront.docker.com`), `repo.mongodb.org`, `downloads.mongodb.com` y `fastdl.mongodb.org` están bloqueados por la política de egress; MongoDB no está en los repos apt. |
| Library (4001) | ⚠️ No arrancado end-to-end (depende de MongoDB) |
| Frontend (5173) | ⚠️ Compila (build OK); flujo en navegador no ejecutado (depende de Library+Mongo) |

---

## 5. Comandos exactos y resultados

| Comando | Resultado |
| --- | --- |
| `pnpm install` | ✅ OK — 5 proyectos, argon2 compilado |
| `node --check` (todos los `.js`/`.mjs` de backend + scripts) | ✅ OK — sin errores de sintaxis |
| `pnpm build` | ✅ OK — frontend Vite, 1865 módulos, build en ~349 ms |
| `pnpm lint` | ✅ OK — eslint exit 0 |
| `git diff --check` | ✅ limpio |
| Lockfiles | ✅ solo `pnpm-lock.yaml`; sin `package-lock.json`/`yarn.lock` |
| TypeScript | ✅ ninguno |

### Verificación en runtime (infra real disponible)

- **Auth (PostgreSQL real):** register → `201`; login → `200` con `data.token`; JWT con `sub`, `role=LIBRARIAN_ROLE`, `iss=biblioteca-auth`, `aud=biblioteca-services`, `exp`; **firma verificada** con el secreto compartido. ✅
- **Statistics (real):**
  - `GET /api/v1/statistics` sin JWT → **401** (protección S2-10 aplicada). ✅
  - `GET /api/v1/statistics` con JWT válido y Library caído → **503** (JWT aceptado, dependencia no disponible). ✅
  - `GET /api/v1/summary` (público) con Library caído → **503**; el servicio sigue vivo (`/health` 200). ✅
- **Library — montaje y protección de rutas (routers y middlewares reales, sin Mongo, 10/10 PASS):**
  - `POST/PUT/DELETE /books` sin JWT → **401**; con rol ≠ LIBRARIAN → **403**; token inválido → **401**. ✅
  - `GET/POST /loans` y `POST /returns` sin JWT → **401**; mutaciones con rol ≠ LIBRARIAN → **403**. ✅
  - (Confirma que la corrección de `book.routes.js` cierra el hueco de protección y que Loans/Returns quedan montados y protegidos.)

### Smoke Sprint 2 (ejecución honesta, infra parcial)

`pnpm smoke:sprint2` con Auth+Statistics reales y **Library/Mongo no disponible**:

```
PASS  1. Health Auth
FAIL  2. Health Library — fetch failed        (MongoDB no provisionable aquí)
PASS  3. Health Statistics
PASS  4. Registrar usuario unico (201)
PASS  5. Login (200)
PASS  6. Obtener JWT
FAIL  7. POST /books sin JWT devuelve 401 — fetch failed   (Library caído)
FAIL  8. Crear Book con JWT (201) — fetch failed           (Library caído)
Resultado: 5 PASS, 3 FAIL, 0 SKIP
```

> El smoke es correcto y ejercita servicios reales. Los FAIL se deben exclusivamente a que **MongoDB no puede provisionarse en este sandbox**, no a un defecto de código. Debe ejecutarse completo en un entorno con MongoDB (ver §7).

---

## 6. Revisión de calidad

- `git diff --check`: limpio. ✅
- Sin `console.log` de JWT/token. ✅
- Sin `.env` versionado. ✅
- Un solo `pnpm-lock.yaml`; sin `package-lock.json` ni `yarn.lock`. ✅
- Sin TypeScript. ✅
- Sin rutas duplicadas; sin imports rotos (los dos imports rotos se corrigieron). ✅
- Respuestas respetan `docs/contracts.md`. ✅

---

## 7. Incidencias, pruebas no ejecutadas y riesgos

### Pruebas NO ejecutadas en este entorno (por falta de MongoDB)

1. Smoke Sprint 2 completo (pasos 8–20: CRUD real, préstamo/devolución, disponibilidad, cálculo de métricas).
2. Smoke Sprint 1 completo (depende de Library+Mongo).
3. Flujo en navegador (registro → crear/editar libro → prestar → no disponible → estadísticas → devolver → disponible → eliminar → logout).
4. Comprobación 21 del smoke (503 con Library apagado de forma controlada): queda como `SKIP` salvo que se defina `SMOKE_STATS_LIBDOWN_URL`.

> Estas pruebas están **pendientes de ejecución por el equipo en un entorno con MongoDB real**. La lógica de negocio subyacente (S2-02/S2-03/S2-05) ya estaba implementada y fusionada en `main` mediante PR revisados; S2-10 verificó que quede correctamente montada y protegida.

### Riesgo abierto — S2-00 (DIFERIDO)

- La rotación/purga de credenciales expuestas en el historial de Git (Supabase, Gmail, Cloudinary; commits `6a3d9c2`, `8cd4b25`) **sigue diferida por decisión del Scrum Master**. No está resuelta.
- Mientras S2-00 siga pendiente, el veredicto máximo del proyecto es **APROBADO CON OBSERVACIONES**.

### Bugs conocidos corregidos en esta integración

- Protección JWT de Books rota por import incorrecto (mayúsculas/ruta) → **corregido y verificado (401/403)**.
- UI de Books consumía un mock → **corregido, ahora consume Library real**.
- `StatisticsPanel` con imports inexistentes → **corregido**.

### Bugs conocidos abiertos

- Ninguno a nivel de código detectado tras la integración. Pendiente únicamente la validación E2E con MongoDB (arriba).

---

## 8. Veredicto y justificación

### APROBADO CON OBSERVACIONES

**Justificación:** La integración del Sprint 2 está completa a nivel de código y verificada estáticamente (`install`/`build`/`lint`/`node --check` OK) y en runtime para todo lo que el entorno permite: Auth end-to-end contra PostgreSQL real, Statistics real (protección JWT de `/statistics` y `503` ante caída de Library), y el montaje/protección de las rutas de Library (Books, Loans, Returns) con los routers y middlewares reales (10/10). Se corrigieron tres incompatibilidades reales de integración (JWT de Books, mock de Books en el frontend, imports rotos de Statistics) con cambios mínimos y preservando la autoría.

Las dos observaciones que impiden un `APROBADO` limpio son:

1. **S2-00 (seguridad del historial) diferido** — techo contractual del veredicto.
2. **El smoke E2E con MongoDB y el flujo en navegador no pudieron ejecutarse en este entorno** porque MongoDB no es provisionable aquí (egress bloqueado). Quedan como prueba pendiente para el equipo en un entorno con MongoDB.

No se declara `APROBADO` con mocks ni se ocultan pruebas fallidas: el smoke se ejecutó y se reporta su resultado real y parcial. No se usa `BLOQUEADO`/`NO APROBADO` porque no hay evidencia de que el código esté roto (al contrario, lo verificable pasa), sino una limitación de infraestructura del sandbox, explícitamente documentada.
