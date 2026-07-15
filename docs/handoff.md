# Actualización de handoff — Inicio del Sprint 2

Última actualización: 15/07/2026-04:22pm
Responsable: Scrum Master
Sprint actual: Sprint 2

1. Estado general
Estado:
INTEGRADO (APROBADO CON OBSERVACIONES)
Valores permitidos:
NO INICIADO
EN PROGRESO
BLOQUEADO
LISTO PARA INTEGRAR
INTEGRADO
FINALIZADO

Nota: verificación de integración completa registrada en docs/integration-sprint-1.md.

2. Rama principal
main
Rama de trabajo de la integración: ft/angel

3. Estado por componente

Fundación del monorepo
Estado: INTEGRADO
Responsable: Scrum Master
Completado y probado:
Workspace pnpm (4 proyectos).
Configuración raíz (package.json con scripts dev:*, smoke:sprint1).
Documentación compartida (contracts, sprint-1, handoff, integration).
Un único lockfile en la raíz (eliminados lockfiles internos).
pnpm install / build / lint OK desde la raíz.
Bloqueos:
Ninguno.

Auth Service
Estado: INTEGRADO
Responsable: Scrum Master
Persistencia: PostgreSQL + Sequelize (Argon2, JWT).
Completado y probado:
Modelo User (UUID, email único en minúsculas, password hasheada).
Registro (201), duplicado (409), login (200), credenciales incorrectas (401), validación (400).
Contraseña almacenada como hash Argon2 (verificado en PostgreSQL).
JWT con sub, role, iss, aud, exp.
/health 200.
Bloqueos:
Ninguno funcional. Ver problema de secretos en historial (sección 7).

Library Service
Estado: INTEGRADO
Responsable: Backend Developer A
Completado y probado:
Modelo Book.
Conexión real a MongoDB.
GET /api/v1/books → {items, total} (total === items.length, createdAt presente).
Script seed idempotente (pnpm --filter service-library seed).
/health 200.
Bloqueos:
Ninguno.

Statistics Service
Estado: INTEGRADO
Responsable: Backend Developer B
Completado y probado:
Consumo HTTP de Library con fetch nativo + timeout (AbortSignal.timeout).
Validación del contrato de Library (200 inválido → 503).
GET /api/v1/summary → {totalBooks, availableBooks, categories, latestBooks} (cálculo propio verificado: 6/4/4, últimos 5 en orden desc).
Manejo de caída de Library → 503 sin stack trace; el servicio sigue vivo.
/health 200.
Bloqueos:
Ninguno.

Frontend
Estado: INTEGRADO
Responsable: Frontend Developer
Completado y probado (en navegador):
/register, /login, /app.
Validación de contraseña mínima 8 (alineada con Auth) sin llamar a Auth si falla.
Lectura de errores de validación (errors[0].message).
Consumo de Auth real vía Axios; sin errores CORS.
Estado de autenticación con Zustand persistente (sobrevive recarga).
Logout limpia sesión y redirige a /login.
El JWT no se muestra en pantalla.
Bloqueos:
Ninguno.

4. Contratos vigentes
Fuente de verdad:
docs/contracts.md
Cambios realizados durante el sprint:
Variables de Auth: DATABASE_URL (PostgreSQL) en lugar de URI_MONGO — ya reflejado en contracts.md sección 11.

5. Pull Requests
Componente	PR	Estado	Revisado por
Fundación/Auth	#3	Integrado	Equipo
Library	#1	Integrado	Equipo
Statistics	#4	Integrado	Equipo
Frontend	#2	Integrado	Equipo
Integración/cierre Sprint 1	Pendiente	Por crear	Pendiente

6. Pruebas ejecutadas
Instalación (pnpm install raíz): OK
Build (pnpm build): OK
Lint (pnpm lint): OK
Auth (register/login/409/401/400 + hash Argon2 + JWT): OK
Library (GET /books real + seed): OK
Statistics (summary real + caída 503): OK
Frontend (flujo completo en navegador, 16 checks): OK
Smoke test (pnpm smoke:sprint1): 11 PASS / 0 FAIL
Flujo completo desde main: pendiente (probado desde rama de integración ft/angel; falta merge a main)

7. Problemas conocidos
1. Secretos en el historial de Git: service-auth/.env de sprints previos (commits 6a3d9c2, 8cd4b25) con credenciales reales (Supabase, Gmail, Cloudinary). No está en el árbol actual pero sí en el historial. Acción: rotar credenciales y purgar historial. Bloquea un APROBADO limpio.
2. Auth verificado contra un contenedor Docker de PostgreSQL (puerto 5434) por no conocerse la contraseña del PostgreSQL local (5432). Cada integrante configura su propio DATABASE_URL.
3. /health de Library y Statistics no usa el formato común (contracts.md no lo define; no bloqueante).

8. Decisiones tomadas
Todo el proyecto usa JavaScript + ESM + pnpm + Node.js 22.
Auth usa PostgreSQL + Sequelize (corrección respecto al plan inicial que decía Mongoose).
Library usa MongoDB + Mongoose.
Statistics no usa base de datos; consume Library con fetch nativo.
Contraseña mínima 8 caracteres en cliente y servidor.
Docker solo como infraestructura local de prueba (sin Dockerfiles en el repo).
Los contratos están congelados en docs/contracts.md.

9. Próximo paso inmediato
Crear el PR de cierre/integración del Sprint 1 hacia main.
Rotar y purgar los secretos del historial.
Ejecutar el smoke test una vez integrado en main.

10. Condición para iniciar el Sprint 2
El Sprint 2 puede planificarse tras la Review, considerando:
qué quedó funcional (todo el incremento del Sprint 1);
la observación de seguridad (secretos en historial) resuelta o con plan;
los contratos a conservar (los actuales, congelados);
próximas capacidades: CRUD de libros, préstamos/devoluciones, protección JWT en Library/Statistics, estadísticas ampliadas.

11. Información necesaria para continuar en otra sesión
Leer en este orden:
Proyecto.md
ARQUITECTURA 1.md
docs/contracts.md
docs/sprint-1.md
docs/handoff.md
docs/integration-sprint-1.md
El código del subproyecto correspondiente
No asumir que una funcionalidad está terminada si no aparece como completada y probada en este documento.

## Estado del Sprint 1

Estado: CERRADO — APROBADO CON OBSERVACIONES

Resultados:

* Monorepo integrado.
* Auth probado con PostgreSQL y Sequelize.
* Library probado con MongoDB y Mongoose.
* Statistics probado contra Library real.
* Frontend probado contra Auth real.
* Smoke test: 11 PASS / 0 FAIL.
* Build y lint correctos.

Observación de seguridad:

* Se detectaron credenciales reales en el historial de Git.
* Las credenciales deben rotarse.
* El historial debe purgarse o trasladarse a un remoto limpio.
* No se considera abierta la implementación del Sprint 2 hasta cerrar esta acción.

## Estado general del Sprint 2

Estado: PLANIFICADO

Objetivo:

Permitir que un usuario autenticado administre libros, registre préstamos y devoluciones y consulte estadísticas iniciales mediante los servicios integrados.

## Documentos vigentes

* `docs/contracts.md`
* `docs/sprint-2.md`
* `docs/handoff.md`
* `ARQUITECTURA 1.md`
* `Proyecto.md`

## Tareas asignadas

| ID     | Responsable  | Rama                        | Estado                              |
| ------ | ------------ | --------------------------- | ------------------------------------ |
| S2-00  | Scrum Master | seguridad/repositorio       | **Diferido** por decisión expresa del Scrum Master (no cerrado, no solucionado) |
| S2-00B | Scrum Master | ft/angel                    | Ver sección "Actualización — S2-00B" más abajo |
| S2-01 | Por asignar  | sprint2/jwt-library         | Ready     |
| S2-02 | Por asignar  | sprint2/books-crud          | Ready     |
| S2-03 | Por asignar  | sprint2/loans-returns       | Ready     |
| S2-04 | Por asignar  | sprint2/jwt-statistics      | Ready     |
| S2-05 | Por asignar  | sprint2/statistics          | Ready     |
| S2-06 | Por asignar  | sprint2/frontend-api        | Ready     |
| S2-07 | Por asignar  | sprint2/frontend-books      | Ready     |
| S2-08 | Por asignar  | sprint2/frontend-loans      | Ready     |
| S2-09 | Por asignar  | sprint2/frontend-statistics | Ready     |
| S2-10 | Scrum Master | sprint2/integration         | Pendiente |

## Bloqueos iniciales

* Rotación y purga de credenciales expuestas.
* Asignación definitiva de responsables.
* Copiar los contratos del Sprint 2 a `docs/contracts.md`.

## Próximo paso

1. Cerrar S2-00.
2. Congelar contratos.
3. Asignar responsables.
4. Crear ramas.
5. Entregar un prompt independiente por tarea.

## Actualización — S2-00B (Congelación contractual y preparación técnica)

Responsable: Scrum Master (Fable 5).
Rama: `ft/angel`.

Resultado:

- **S2-00 (rotación/purga de credenciales) fue diferido por decisión expresa del Scrum Master.** No se marca como cerrado, aprobado, solucionado ni verificado. El riesgo de secretos históricos permanece **abierto**.
- Mientras S2-00 siga pendiente, el veredicto máximo del proyecto es `APROBADO CON OBSERVACIONES`; no puede declararse un `APROBADO` limpio.
- `docs/contracts.md` fue ampliado con una sección "Contratos congelados — Sprint 2" (JWT, Books, Loans/Returns, Statistics, Frontend, variables compartidas), preservando intactos los contratos del Sprint 1.
- `docs/sprint-2.md` fue corregido únicamente donde contradecía los contratos congelados: `available` no editable por el cliente, `GET /summary` público, `GET /statistics` protegido, Books conserva `_id`, DELETE es borrado físico, y notas explícitas de que S2-00 está diferido (no solucionado) y de que no se introduce ninguna función del Sprint 3.
- Dependencias añadidas mediante `pnpm --filter <paquete> add <dep>` (sin fijar versiones manualmente):
  - `service-library`: `jsonwebtoken`, `express-validator`.
  - `service-statistics`: `jsonwebtoken`.
- Variables `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` documentadas (placeholders, sin secretos reales) en `service-library/.env.example`, `service-statistics/.env.example` y en el `.env.example` raíz.
- Sigue existiendo un único `pnpm-lock.yaml` en la raíz; no se generaron lockfiles internos.
- **No se implementó ninguna feature funcional del Sprint 2** (sin middlewares JWT, sin controllers, sin routers montados, sin CRUD de Books, sin Loans/Returns, sin cambios en Statistics ni en frontend).

Estado sugerido de S2-00B: ver reporte de la tarea (`DONE` a nivel de preparación técnica; **no** implica que S2-00 ni el Sprint 2 estén cerrados).

**El Sprint 2 se abre bajo observación únicamente si todas las verificaciones de S2-00B (`pnpm install`, `pnpm build`, `pnpm lint`, comprobación sintáctica de los tres servicios, único lockfile en la raíz) pasan.** Ver comandos y resultados en el reporte de la tarea S2-00B.
