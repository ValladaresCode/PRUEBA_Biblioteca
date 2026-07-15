# Informe de Integración — Sprint 1

- **Fecha:** 2026-07-15
- **Rama:** `ft/angel` (base commit `87c273f`; incluye cambios de integración en el árbol de trabajo, aún sin commitear)
- **Node.js:** v22.21.0
- **pnpm:** 10.29.3
- **Responsable de la integración:** Ingeniero principal (cierre de Sprint 1)

## Infraestructura utilizada

| Componente | Detalle |
| --- | --- |
| PostgreSQL (Auth) | Contenedor Docker `biblioteca-auth-db` (`postgres:16`), puerto host **5434**, base `biblioteca_auth`. Solo infraestructura local de prueba; no se añadió Dockerfile/compose al repo. |
| MongoDB (Library) | Instancia local en `localhost:27017`, base `biblioteca_library`. |
| Motivo del contenedor | El PostgreSQL local (5432) tiene una contraseña desconocida; se usó un contenedor con credencial conocida para poder verificar Auth con PostgreSQL real. |

## Instalación y comprobaciones estáticas

| Comando | Resultado |
| --- | --- |
| `pnpm install` (raíz) | ✅ OK — 4 proyectos, `argon2` compilado |
| `pnpm build` | ✅ OK — frontend compila (Vite, 1848 módulos) |
| `pnpm lint` | ✅ OK — exit 0 |
| `node --check` (20 archivos backend + smoke) | ✅ OK — sin errores de sintaxis |
| Lockfiles | ✅ Solo `/pnpm-lock.yaml`; sin `package-lock.json`, `yarn.lock` ni lockfiles internos |
| Secretos rastreados | ✅ Ninguno en el árbol actual (solo `.env.example`) — ⚠️ ver Problemas pendientes |

## Resultado por servicio (arranque real)

| Servicio | Puerto | Health | Conexión |
| --- | --- | --- | --- |
| Auth | 4000 | 200 | PostgreSQL conectado ✅ |
| Library | 4001 | 200 | MongoDB conectado ✅ |
| Statistics | 4002 | 200 | Sin BD (consume Library por HTTP) ✅ |
| Frontend | 5173 | 200 | Consume Auth real ✅ |

## Pruebas de Auth (Fase 8)

| Caso | Esperado | Resultado |
| --- | --- | --- |
| Registro (password ≥ 8) | 201 | ✅ 201, usuario creado |
| Usuario en PostgreSQL | fila creada | ✅ verificada en tabla `users` |
| Contraseña almacenada | hash Argon2 | ✅ `$argon2id$v=19$m=65536,t=3,p=4$...` |
| Contraseña en respuesta | ausente | ✅ ausente |
| Correo duplicado | 409 | ✅ 409 |
| Contraseña incorrecta | 401 | ✅ 401 |
| Login correcto | 200 + token + user | ✅ 200, token y user presentes, sin password |
| JWT claims | sub, role, iss, aud, exp | ✅ `sub`=UUID, `role`=LIBRARIAN_ROLE, `iss`=biblioteca-auth, `aud`=biblioteca-services, `exp`=+2h |

## Pruebas de Library (Fase 9)

| Caso | Resultado |
| --- | --- |
| `GET /api/v1/books` | ✅ 200 |
| Conexión real MongoDB | ✅ |
| `data.items` es array | ✅ |
| `data.total` === `items.length` | ✅ (6 === 6) |
| `createdAt` presente | ✅ en todos los libros |
| Seed idempotente | ✅ 6 libros insertados; 2ª corrida no duplica |

Datos de prueba: 6 libros, 4 categorías (Novela, Ciencia, Historia, Tecnología), 4 disponibles / 2 no disponibles, `createdAt` distintos.

## Pruebas de Statistics (Fase 10)

| Caso | Resultado |
| --- | --- |
| `GET /api/v1/summary` con Library real | ✅ 200 |
| `totalBooks` | ✅ 6 |
| `availableBooks` | ✅ 4 |
| `categories` (únicas) | ✅ 4 |
| `latestBooks` (máx. 5, orden desc por `createdAt`) | ✅ 5, orden correcto (Clean Code → La sombra; "Cien años" excluido por ser el 6º) |
| Library caído → `/summary` | ✅ 503, mensaje comprensible, sin stack trace |
| Statistics sigue vivo tras caída | ✅ health 200 |
| Library reiniciado → `/summary` | ✅ 200 |

## Pruebas del Frontend (Fase 11, en navegador)

Los 16 pasos verificados: `/register` rechaza contraseña de 6 caracteres **sin** llamar a Auth (0 peticiones); registro con 8+ → 201 con feedback de éxito y redirección; login → redirección a `/app` con el nombre visible; recarga mantiene la sesión (Zustand persist); logout redirige a `/login` y limpia el estado; credenciales incorrectas muestran "Credenciales incorrectas"; sin errores CORS (preflight OPTIONS → 204); el JWT no se muestra en pantalla.

## Smoke test (Fase 12)

`pnpm smoke:sprint1` → **11 PASS, 0 FAIL**, exit 0.

## Archivos corregidos / creados en la integración

- `frontend/src/pages/RegisterPage.jsx` — validación mínima 6→8, mensaje, placeholder, y lectura de `errors[0].message` (con respaldo al mensaje general).
- `service-statistics/src/statistics/statistics.service.js` — timeout con `AbortSignal.timeout`, validación estricta del contrato de Library (200 inválido → 503).
- `docs/sprint-1.md` — S1-02 corregida a PostgreSQL + Sequelize.
- `frontend/.env.example` — creado.
- `package.json` (raíz) — scripts `dev:*` y `smoke:sprint1`.
- `scripts/smoke-sprint-1.mjs` — creado.
- `service-library/scripts/seed-books.js` + script `seed` — creados.
- `README.md` — instrucciones completas de ejecución.
- Eliminados lockfiles internos rastreados: `frontend/pnpm-lock.yaml`, `service-library/pnpm-lock.yaml`.
- `.env` locales creados (ignorados por Git) para los cuatro servicios.

## Contratos verificados (docs/contracts.md)

| Contrato | Estado |
| --- | --- |
| Puertos 5173/4000/4001/4002 | ✅ |
| Prefijo `/api/v1` | ✅ en los tres servicios |
| Registro/login (forma de respuesta) | ✅ |
| Payload JWT (sub, role, iss, aud, exp) | ✅ |
| `GET /books` → `{items, total}` | ✅ |
| `GET /summary` → `{totalBooks, availableBooks, categories, latestBooks}` | ✅ |
| Formato común de éxito/error | ✅ |

## Problemas pendientes

1. **🔴 Secretos en el historial de Git.** El archivo `service-auth/.env` de sprints anteriores (commits `6a3d9c2`, `8cd4b25`) contiene credenciales reales (Supabase, Gmail app-password, Cloudinary). **No** está en el árbol actual, pero permanece en el historial (y probablemente en `origin`). Acción requerida: **rotar** esas credenciales y **purgar** el historial (`git filter-repo` o BFG). Este punto impide un veredicto `APROBADO` limpio.
2. **🟡 PostgreSQL de Auth vía contenedor Docker.** La verificación usó un contenedor (5434) porque la contraseña del PostgreSQL local (5432) es desconocida. Funcionalmente equivalente, pero cada integrante debe configurar su propio `DATABASE_URL`.
3. **🟡 `/health` no uniforme.** Library y Statistics devuelven `{status, service, timestamp}` en vez del formato común. `contracts.md` no define `/health`, así que no es bloqueante; unificar en el Sprint 2 si se desea.

## Veredicto final

### APROBADO CON OBSERVACIONES

Todo el incremento funcional del Sprint 1 fue verificado de extremo a extremo contra infraestructura real (PostgreSQL y MongoDB reales, Statistics contra Library real, Frontend contra Auth real), el smoke test pasa 11/11 y los contratos se respetan. La única observación bloqueante para un `APROBADO` limpio es la **exposición de secretos en el historial de Git** (punto 1), que debe resolverse con rotación de credenciales y limpieza del historial. No es un defecto de la funcionalidad del Sprint 1, sino de higiene del repositorio heredada de sprints previos.
