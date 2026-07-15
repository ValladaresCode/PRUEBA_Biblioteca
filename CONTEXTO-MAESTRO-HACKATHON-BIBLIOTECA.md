# CONTEXTO MAESTRO — Proyecto escolar tipo hackathon / Scrum

## Instrucción principal para el siguiente agente

Recibirás el repositorio completo del proyecto.

Antes de planificar, crear prompts o modificar código, debes inspeccionar el repositorio real y leer la carpeta `docs/`.

Lee, como mínimo, en este orden:

1. `Proyecto.md`
2. `ARQUITECTURA 1.md`
3. `docs/contracts.md`
4. `docs/sprint-1.md`
5. `docs/integration-sprint-1.md`
6. `docs/handoff.md`
7. `docs/sprint-2.md`
8. `README.md`
9. `package.json` raíz
10. `pnpm-workspace.yaml`
11. Los `package.json` de los cuatro subproyectos
12. El código real de cada servicio y del frontend

No confíes únicamente en este resumen. Este documento explica las decisiones tomadas, pero el código y la carpeta `docs/` son la fuente de verdad sobre el estado actual.

No reconstruyas el proyecto desde cero. No reemplaces código funcional por una arquitectura nueva sin una razón crítica. Primero inspecciona, luego diagnostica y después realiza el cambio mínimo necesario.

---

# 1. Contexto de la actividad

Es una actividad escolar inspirada en una hackathon.

Duración total:

- 4 horas y 30 minutos.
- Tres sprints de 90 minutos.
- Debe utilizarse Scrum.
- Cada sprint debe finalizar con una versión funcional en `main`.
- Cada integrante trabaja en su propia rama.
- Todos deben tener commits propios.
- Los cambios entran mediante Pull Request.
- Debe existir evidencia de colaboración.

El proyecto es un sistema de gestión de biblioteca con arquitectura distribuida.

Componentes obligatorios:

- Frontend en React.
- Servicio de autenticación.
- Servicio A: gestión de biblioteca.
- Servicio B: estadísticas y recomendaciones.
- Persistencia con MongoDB para el dominio de biblioteca.
- Git y GitHub.
- Un único repositorio monorepo.

El usuario es el Scrum Master y también participa técnicamente. No debe terminar haciendo todo solo. Su responsabilidad es mantener contratos, tareas, integración, bloqueos, tablero, Pull Requests y estado del sprint.

---

# 2. Forma de trabajo con IA

## Agentes y roles

### Sol / GPT-5.6 Thinking

Se utiliza para:

- razonamiento de producto;
- planificación;
- análisis de rúbrica;
- definición de alcance;
- contratos;
- backlog;
- objetivos de sprint;
- división de tareas;
- detección de riesgos;
- preparación de prompts;
- revisión del resultado de otros agentes.

### Fable 5

Solo el Scrum Master tiene acceso a Fable 5.

Se utiliza para:

- bases del proyecto;
- arquitectura sensible;
- integración;
- correcciones transversales;
- smoke tests;
- revisión final de cada sprint;
- documentación de cierre y handoff.

Fable no debe recibir todo el proyecto para implementarlo solo. Debe encargarse de las bases o de la integración, dejando trabajo independiente para el resto del equipo.

### Gemini CLI

Se utiliza para tareas delimitadas, por ejemplo:

- servicios independientes;
- estadísticas;
- componentes;
- validaciones;
- pruebas;
- documentación;
- integración con servicios de Google cuando sea necesaria.

### Grok Build

Se utiliza para:

- módulos independientes;
- CRUD;
- debugging;
- revisión;
- frontend;
- integración de features delimitadas.

### DeepSeek

No se ha contratado ni se considera necesario todavía.

Solo tendría sentido para:

- boilerplate;
- pruebas adicionales;
- refactors mecánicos;
- documentación repetitiva;
- tareas muy bien especificadas.

No debe ser arquitecto principal ni dueño de decisiones críticas.

---

# 3. Estrategia para tareas y prompts

Primero se define una tarea neutral. Después se convierte en un prompt adaptado al agente.

Orden correcto:

1. Leer problema y rúbrica.
2. Definir objetivo del sprint.
3. Definir flujo funcional.
4. Definir contratos mínimos.
5. Crear backlog.
6. Crear tareas neutrales.
7. Asignar responsables y agentes.
8. Identificar archivos permitidos y prohibidos.
9. Crear prompts específicos.
10. Ejecutar en paralelo.
11. Integrar.
12. Probar con infraestructura real.
13. Actualizar `docs/handoff.md`.
14. Hacer Review y retrospectiva.

Cada tarea debe incluir:

- ID;
- objetivo;
- contexto;
- dependencias;
- archivos permitidos;
- archivos prohibidos;
- contrato;
- criterios de aceptación;
- comandos de verificación;
- formato del reporte final.

Los agentes no deben decidir libremente el alcance.

Los agentes no deben modificar `docs/handoff.md`. El Scrum Master lo actualiza para evitar conflictos.

No permitir que dos agentes modifiquen simultáneamente los mismos archivos.

Los mocks sirven para desarrollar, pero no cuentan como evidencia final de integración.

---

# 4. Skills y metodología de agentes

Skills consideradas:

- Superpowers.
- Grill Me.
- Junior to Senior.
- Context Canary.
- UI/UX Pro Max.
- Interface Kit.
- The Last 20%.
- F*ck Slop.
- Skills de JuliusBrussee.

Uso acordado:

- Superpowers es el orquestador principal.
- Grill Me se usa antes de congelar planes o arquitectura.
- Junior to Senior revisa planes y código importante.
- Context Canary se usa en sesiones largas.
- UI/UX Pro Max se utiliza para crear sistema visual y revisar UX.
- Interface Kit apoya consistencia de componentes.
- The Last 20% se reserva para el cierre del Sprint 3.
- F*ck Slop se reserva para textos, README, presentación y contenido final.

No ejecutar todas las skills al mismo tiempo.

No utilizar dos orquestadores que compitan por controlar el proceso.

---

# 5. Stack definitivo

Todo el proyecto utiliza JavaScript, no TypeScript.

## Monorepo

- pnpm.
- ESM puro.
- Node.js 22 o superior.
- Un solo `pnpm-lock.yaml` en la raíz.
- `pnpm-workspace.yaml`.
- Cada subproyecto tiene su propio `package.json`.

Estructura:

```text
biblioteca-app/
├── frontend/
├── service-auth/
├── service-library/
├── service-statistics/
├── docs/
├── scripts/
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── README.md
└── .gitignore
```

## Frontend

- React.
- Vite.
- JavaScript.
- Tailwind CSS.
- Axios.
- Zustand.
- React Router.
- Lucide React.
- React Hot Toast.

## Auth

- Node.js.
- Express 5.
- PostgreSQL.
- Sequelize.
- `pg`.
- Argon2.
- JWT.
- `express-validator`.
- Helmet.
- CORS.
- Morgan.

Auth NO utiliza MongoDB ni Mongoose.

## Library

- Node.js.
- Express 5.
- MongoDB.
- Mongoose.
- `express-validator`.
- Helmet.
- CORS.
- Morgan.
- JWT validado, no emitido.

## Statistics

- Node.js.
- Express 5.
- Sin base de datos propia durante los primeros sprints.
- Consume Library por HTTP.
- Usa `fetch` nativo de Node.
- Debe implementar lógica propia.
- No puede limitarse a reenviar respuestas.

## Puertos

- Frontend: `5173`.
- Auth: `4000`.
- Library: `4001`.
- Statistics: `4002`.

## Bases de datos

- Auth: PostgreSQL, base `biblioteca_auth`.
- Library: MongoDB, base `biblioteca_library`.

---

# 6. Arquitectura de código acordada

Para backend:

```text
index.js
→ carga dotenv
→ conecta base de datos cuando aplique
→ app.listen
```

`configs/app.js`:

1. Helmet.
2. CORS.
3. Morgan.
4. Parsers.
5. Health.
6. Routers.
7. 404.
8. Error handler.

Features organizadas por carpeta:

```text
src/<feature>/
├── <feature>.model.js
├── <feature>.controller.js
├── <feature>.routes.js
├── <feature>.validators.js
└── <feature>.service.js
```

No todas las capas son obligatorias si la feature no las necesita.

Respuestas comunes:

Éxito:

```json
{
  "success": true,
  "message": "Operación completada",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Descripción comprensible",
  "errors": []
}
```

El frontend y los servicios deben respetar `docs/contracts.md`.

---

# 7. Dirección de frontend y UI

No se quiere el diseño genérico producido por IA.

Evitar:

- gradientes morados genéricos;
- glassmorphism;
- tarjetas para todo;
- sombras excesivas;
- dashboard SaaS sin personalidad;
- iconos decorativos;
- textos artificiales;
- exceso de bordes redondeados.

Dirección deseada:

- editorial;
- académica;
- moderna;
- clara;
- apropiada para una biblioteca escolar;
- navegación fácil;
- estados de loading, empty, error y éxito;
- responsive.

UI/UX Pro Max debe crear o respetar un sistema visual persistido en un documento como:

```text
design-system/MASTER.md
```

La skill es una herramienta de análisis, no debe elegir una dirección artística aleatoria.

---

# 8. Scrum adaptado a cuatro horas y media

Se utiliza Scrum de forma ligera.

Cada sprint dura 90 minutos.

Tablero recomendado:

- Backlog.
- Ready.
- In Progress.
- Review.
- Done.
- Blocked.

Límite:

- Una tarea principal activa por persona.
- Máximo dos solo si son pequeñas y no dependen entre sí.

Definition of Ready:

- objetivo claro;
- contrato definido;
- archivos permitidos;
- criterios de aceptación;
- dependencias identificadas;
- responsable asignado.

Definition of Done:

- código implementado;
- integrado;
- contrato respetado;
- pruebas ejecutadas;
- build y lint aplicables;
- sin secretos;
- commit propio;
- Pull Request;
- revisión por otra persona;
- funcional desde `main`.

Daily ultracorta:

- qué terminé;
- qué haré;
- qué me bloquea;
- si modifiqué un contrato o archivo compartido.

Review:

- se demuestra código real funcionando.

Retrospectiva:

- qué funcionó;
- qué bloqueó;
- qué acción concreta cambiaremos.

---

# 9. Estado real del Sprint 1

El Sprint 1 se cerró con veredicto:

```text
APROBADO CON OBSERVACIONES
```

## Resultado funcional

- `pnpm install`: OK.
- `pnpm build`: OK.
- `pnpm lint`: OK.
- Comprobación sintáctica backend: OK.
- Auth real: OK.
- Library real: OK.
- Statistics contra Library real: OK.
- Frontend contra Auth real: OK.
- Smoke Sprint 1: `11 PASS / 0 FAIL`.
- CORS: OK.
- Puertos y prefijos: OK.
- Sesión persistente en frontend: OK.
- JWT no se muestra en interfaz.
- Statistics devuelve 503 si Library cae y permanece activo.
- Seed de libros idempotente disponible.
- Solo existe el lockfile raíz.

## Pruebas de Auth

- Registro: 201.
- Correo duplicado: 409.
- Login incorrecto: 401.
- Login correcto: 200.
- Contraseña cifrada con Argon2.
- JWT con `sub`, `role`, `iss`, `aud` y `exp`.
- La contraseña no aparece en respuestas.

## Library

- `GET /api/v1/books`: 200.
- MongoDB real.
- Se probaron seis libros.
- `createdAt` existe.
- `total === items.length`.

## Statistics

Resumen probado:

- totalBooks: 6.
- availableBooks: 4.
- categories: 4.
- latestBooks: 5 y ordenados.

## Frontend

Se probaron 16 verificaciones en navegador:

- validación de contraseña;
- registro;
- login;
- redirección;
- nombre en `/app`;
- persistencia;
- logout;
- errores;
- sin CORS;
- JWT no visible.

## Correcciones realizadas en cierre de Sprint 1

- Frontend pasó de mínimo 6 a 8 caracteres.
- Frontend lee `errors[0].message`.
- `docs/sprint-1.md` corregido para Auth PostgreSQL.
- Creado `frontend/.env.example`.
- Eliminados lockfiles internos.
- Statistics recibió timeout y validación de contrato.
- README ampliado.
- Creado smoke test.
- Creado seed.
- Actualizado handoff.
- Creado reporte de integración.

## Observación de seguridad pendiente

Se encontraron secretos reales en el historial Git, aunque ya no están en el árbol actual.

Se mencionaron:

- Supabase.
- Gmail.
- Cloudinary.
- Commits `6a3d9c2` y `8cd4b25`.

Antes de continuar con funcionalidad del Sprint 2:

1. Rotar o revocar credenciales.
2. Purgar historial con `git filter-repo` o BFG, o crear un remoto limpio.
3. Confirmar que `.env` está ignorado.
4. Registrar la acción en `docs/handoff.md`.

No tratar el Sprint 2 como abierto si siguen activas credenciales expuestas.

---

# 10. Documentos existentes o esperados

El repositorio debe contener:

- `docs/contracts.md`
- `docs/sprint-1.md`
- `docs/integration-sprint-1.md`
- `docs/handoff.md`
- `docs/sprint-2.md`

Funciones:

- `contracts.md`: contratos congelados.
- `sprint-1.md`: objetivo, alcance y Definition of Done del Sprint 1.
- `integration-sprint-1.md`: pruebas reales y veredicto.
- `handoff.md`: estado real del proyecto.
- `sprint-2.md`: plan del Sprint 2.

Antes de ejecutar Sprint 2, copiar o consolidar los contratos de `docs/sprint-2.md` dentro de `docs/contracts.md`.

`docs/handoff.md` debe actualizarse:

1. Al abrir Sprint 2.
2. Cuando cambie un bloqueo importante.
3. Al integrar.
4. Al cerrar Sprint 2.

Los agentes no actualizan `handoff`; lo hace el Scrum Master o el integrador.

---

# 11. Objetivo del Sprint 2

Objetivo:

Al finalizar el Sprint 2, un usuario autenticado podrá administrar libros, registrar préstamos y devoluciones desde el frontend y consultar estadísticas iniciales calculadas por Statistics a partir de información real de Library.

Flujo esperado:

```text
Login
→ JWT
→ crear o editar libro
→ registrar préstamo
→ libro no disponible
→ consultar estadísticas
→ devolver libro
→ libro disponible
```

## Must have del Sprint 2

- CRUD completo de libros.
- Modelo Loan.
- Registrar préstamos.
- Registrar devoluciones.
- Consultar préstamos.
- Persistencia en MongoDB.
- Actualizar disponibilidad.
- JWT en operaciones protegidas de Library.
- JWT en Statistics.
- Frontend conectado con Library y Statistics.
- Interfaz para Books.
- Interfaz para Loans/Returns.
- Estadísticas iniciales.
- PR e integración.
- `main` funcional.

## Should have

- Filtros por título, autor o categoría.
- Confirmación antes de eliminar.
- Loading, empty y errores.
- Préstamos activos y devueltos separados.
- Prevención de doble préstamo.
- Conflictos con 409.

## Fuera del Sprint 2

- Gemini dentro de la aplicación.
- Recomendaciones finales.
- Estadísticas finales por categoría.
- Cloudinary.
- Swagger.
- Docker como entregable.
- Refresh tokens.
- Recuperación de contraseña.
- Multas.
- Reservas.
- Cron.
- Rediseño final.

---

# 12. Contratos principales del Sprint 2

## JWT

Header:

```http
Authorization: Bearer <jwt>
```

Middleware agrega:

```js
req.userId
req.userRole
```

Errores:

- 401 sin token.
- 401 token inválido.
- 403 operación no permitida.

## Books

```http
GET /api/v1/books
POST /api/v1/books
PUT /api/v1/books/:id
DELETE /api/v1/books/:id
```

POST, PUT y DELETE protegidos.

Filtros GET:

```text
?title=
?author=
?category=
```

No eliminar libro con préstamo activo: 409.

## Loan

Campos mínimos:

- `bookId`.
- `borrowerName`.
- `dueDate`.
- `loanDate`.
- `returnedAt`.
- `status`: `ACTIVE` o `RETURNED`.
- `createdBy`.
- timestamps.
- versionKey false.

Endpoints:

```http
GET /api/v1/loans
POST /api/v1/loans
POST /api/v1/returns
```

Reglas:

- libro existente;
- libro disponible;
- dueDate futura;
- préstamo crea `ACTIVE`;
- libro pasa a `available: false`;
- devolución pasa a `RETURNED`;
- `returnedAt` se llena;
- libro vuelve a `available: true`;
- doble préstamo: 409;
- doble devolución: 409.

## Statistics

```http
GET /api/v1/statistics
Authorization: Bearer <jwt>
```

Respuesta calculada:

```json
{
  "success": true,
  "message": "Estadísticas obtenidas correctamente",
  "data": {
    "totalBooks": 0,
    "availableBooks": 0,
    "totalLoans": 0,
    "activeLoans": 0,
    "returnedLoans": 0
  }
}
```

Statistics consume Books y Loans de Library, reenvía el JWT cuando corresponda y calcula la respuesta.

---

# 13. Backlog del Sprint 2

## S2-00 — Seguridad

Responsable: Scrum Master.

- Rotar credenciales.
- Purgar historial o remoto limpio.
- Confirmar `.env`.
- Actualizar handoff.

## S2-01 — JWT de Library

Carpeta:

```text
service-library/middlewares/**
```

- Crear `validate-jwt.js`.
- Verificar token.
- Inyectar userId y role.
- No montar rutas todavía.

## S2-02 — CRUD Books

Carpeta:

```text
service-library/src/books/**
```

- POST.
- PUT.
- DELETE.
- Mantener GET.
- Filtros.
- Validaciones.
- Preparar rutas protegidas.

## S2-03 — Loans y Returns

Carpeta:

```text
service-library/src/loans/**
```

- Modelo Loan.
- GET loans.
- POST loans.
- POST returns.
- Disponibilidad.
- 404 y 409.
- Validaciones.

Esta es una tarea de alto riesgo y debe asignarse al backend más fuerte.

## S2-04 — JWT de Statistics

Carpeta:

```text
service-statistics/middlewares/**
```

- Misma validación JWT.
- No modificar rutas todavía.

## S2-05 — Estadísticas iniciales

Carpeta:

```text
service-statistics/src/statistics/**
```

- Mantener summary.
- Añadir statistics.
- Consumir books y loans.
- Reenviar JWT.
- Calcular resultado.
- Mantener timeout y validación de contratos.

## S2-06 — Cliente HTTP del frontend

Carpeta:

```text
frontend/src/api/**
```

- Axios compartido.
- Adjuntar JWT.
- Books API.
- Loans API.
- Returns API.
- Statistics API.
- Conservar Auth.

## S2-07 — UI Books

Carpetas:

```text
frontend/src/features/books/**
frontend/src/pages/BooksPage.jsx
```

- Lista.
- Filtros.
- Crear.
- Editar.
- Eliminar.
- Confirmación.
- Loading, empty y error.

## S2-08 — UI Loans

Carpetas:

```text
frontend/src/features/loans/**
frontend/src/pages/LoansPage.jsx
```

- Listar activos y devueltos.
- Registrar préstamo.
- Elegir libros disponibles.
- Registrar devolución.
- Actualizar vista.

## S2-09 — UI Statistics

Carpetas:

```text
frontend/src/features/statistics/**
frontend/src/components/statistics/**
```

- Mostrar cinco métricas.
- Loading.
- Error.
- Componente integrable.

## S2-10 — Integración

Responsable: Scrum Master con Fable 5.

- Montar routers.
- Aplicar JWT.
- Integrar navegación.
- Integrar páginas.
- Resolver conflictos.
- Actualizar env examples.
- Smoke Sprint 2.
- README.
- Handoff.
- Review.

---

# 14. Archivos reservados para el integrador

Para evitar conflictos, los agentes de features no modifican:

```text
docs/contracts.md
docs/handoff.md
service-library/configs/app.js
service-statistics/configs/app.js
frontend/src/router/**
frontend/src/layouts/**
frontend/src/App.jsx
package.json raíz
scripts/**
README.md
```

Estos archivos pertenecen a S2-10.

Los agentes deben reportar qué montaje requieren, pero no modificar los archivos compartidos.

---

# 15. Dependencias del Sprint 2

```text
S2-01 → protección Library
S2-02 → UI Books
S2-03 → Statistics y UI Loans
S2-04 → protección Statistics
S2-05 → UI Statistics
S2-06 → UI Books, Loans y Statistics
Todo → S2-10
```

Los agentes pueden trabajar con mocks locales o contratos congelados mientras esperan integraciones, pero la validación final debe usar servicios reales.

---

# 16. Ramas sugeridas

```text
sprint2/jwt-library
sprint2/books-crud
sprint2/loans-returns
sprint2/jwt-statistics
sprint2/statistics
sprint2/frontend-api
sprint2/frontend-books
sprint2/frontend-loans
sprint2/frontend-statistics
sprint2/integration
```

Cada integrante:

- crea su rama desde `main`;
- no trabaja directamente en `main`;
- hace commits propios;
- abre PR;
- recibe revisión;
- integra;
- vuelve a probar desde `main`.

---

# 17. Tiempo del Sprint 2

```text
0–10 min: planning, contratos, tareas, ramas.
10–55 min: implementación paralela.
55–65 min: revisión y primeros PR.
65–78 min: integración.
78–85 min: smoke y frontend.
85–90 min: review, retrospectiva y handoff.
```

A los 55 minutos debe existir código funcional. No seguir diseñando arquitecturas.

---

# 18. Smoke test esperado para Sprint 2

Debe comprobar:

1. Login.
2. JWT.
3. Crear libro.
4. Editar libro.
5. Consultar libros.
6. Registrar préstamo.
7. Confirmar no disponible.
8. Consultar préstamos.
9. Consultar Statistics.
10. Registrar devolución.
11. Confirmar disponible.
12. Eliminar libro.
13. 401 sin JWT.
14. 409 en conflictos.
15. Los servicios permanecen activos.

No aprobar Sprint 2 solo con pruebas aisladas.

---

# 19. Cómo crear los prompts del Sprint 2

Antes de generar los prompts:

1. Leer el repo.
2. Confirmar que `docs/sprint-2.md` está presente.
3. Actualizar contratos.
4. Actualizar handoff.
5. Asignar tareas según personas y agentes.
6. Confirmar cuántos integrantes y agentes estarán trabajando.
7. Evitar superposición de archivos.

Cada prompt debe iniciar con:

```text
Antes de modificar código:

1. Lee Proyecto.md.
2. Lee ARQUITECTURA 1.md.
3. Lee docs/contracts.md.
4. Lee docs/sprint-2.md.
5. Lee docs/handoff.md.
6. Inspecciona el código real de tu subproyecto.
7. Trabaja únicamente en la tarea asignada.
```

Cada prompt debe terminar solicitando:

- archivos modificados;
- decisiones;
- comandos;
- pruebas;
- problemas;
- bloqueos;
- estado sugerido;
- mensaje de commit;
- descripción de PR.

Los agentes no modifican handoff.

---

# 20. Planificación del Sprint 3

No debe cerrarse todavía.

Según el documento oficial, el Sprint 3 debe incluir:

- validaciones en cliente y servidor;
- manejo de errores;
- mejoras visuales;
- estadísticas completas;
- recomendaciones;
- resumen general;
- integración final;
- aplicación completamente funcional;
- PR final.

El Sprint 3 debe planificarse después de la Review del Sprint 2, utilizando:

- tareas terminadas;
- pendientes;
- bugs;
- capacidad real del equipo;
- cambios de contratos;
- retroalimentación visual;
- estabilidad de integración.

No introducir Gemini antes de que CRUD, préstamos, devoluciones y estadísticas básicas estén funcionando.

---

# 21. Reglas para el siguiente agente

- No asumir que un reporte equivale a código funcional.
- Leer `docs/` y ejecutar pruebas.
- No cambiar JavaScript por TypeScript.
- No cambiar Auth a MongoDB.
- No cambiar Library a PostgreSQL.
- No convertir todo en microservicios adicionales.
- No añadir funciones fuera del sprint.
- No permitir que agentes compartan archivos.
- No reescribir código estable por preferencia personal.
- No declarar aprobado sin infraestructura real.
- No utilizar mocks como evidencia final.
- No subir secretos.
- No llenar el contexto principal con skills innecesarias.
- No dejar integración para el final absoluto.
- Mantener `main` funcional al cerrar cada sprint.
- Priorizar el flujo demostrable sobre funciones decorativas.
- Tratar la seguridad del historial Git como tarea previa obligatoria.

---

# 22. Primera acción esperada del siguiente agente

Después de recibir el repositorio:

1. Confirmar que leyó la carpeta `docs/`.
2. Inspeccionar el estado actual del código y Git.
3. Confirmar si la limpieza de secretos ya se realizó.
4. Comparar `docs/sprint-2.md` con el código.
5. Detectar contradicciones o dependencias no previstas.
6. Proponer la asignación concreta de tareas según el número de integrantes.
7. Generar prompts separados para Fable 5, Gemini CLI y Grok Build.
8. No ejecutar Sprint 3 todavía.
