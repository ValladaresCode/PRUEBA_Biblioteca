# Sprint 2 — Lógica principal e integración funcional

## Duración

90 minutos.

## Estado de entrada

El Sprint 2 puede iniciar únicamente cuando:

- El Sprint 1 está integrado en `main`.
- `pnpm install`, `pnpm build`, `pnpm lint` y `pnpm smoke:sprint1` funcionan.
- Auth funciona con PostgreSQL y Sequelize.
- Library funciona con MongoDB y Mongoose.
- Statistics consume Library real.
- Frontend consume Auth real.
- Las credenciales expuestas en el historial de Git fueron rotadas y el historial fue purgado o el repositorio remoto fue reemplazado de forma segura.
- `docs/handoff.md` refleja el cierre real del Sprint 1.
- `docs/contracts.md` contiene los contratos congelados del Sprint 2.

> **Nota (S2-00 diferido):** la rotación/purga de credenciales (S2-00) fue diferida por decisión expresa del Scrum Master; no está resuelta. El Sprint 2 continúa bajo **riesgo aceptado**, no bajo la condición de entrada cumplida. Mientras S2-00 siga pendiente, el veredicto máximo del proyecto es `APROBADO CON OBSERVACIONES`. No se introduce ninguna función del Sprint 3 durante este Sprint.

## Objetivo del Sprint

Al finalizar el Sprint 2, un usuario autenticado podrá administrar el catálogo de libros, registrar préstamos y devoluciones desde el frontend y consultar estadísticas iniciales calculadas por el Servicio Statistics a partir de información real del Servicio Library.

Los cambios deberán estar integrados mediante Pull Requests y la rama `main` deberá conservar una versión funcional.

## Incremento funcional esperado

### Gestión de libros

```text
Frontend
→ Crear, editar o eliminar libro
→ Envía JWT
→ Library valida JWT
→ MongoDB persiste el cambio
→ Frontend actualiza el catálogo
```

### Préstamo

```text
Frontend
→ Selecciona libro disponible
→ Registra datos del prestatario y fecha límite
→ Library valida JWT y disponibilidad
→ Crea Loan
→ Marca el libro como no disponible
→ Frontend muestra el préstamo activo
```

### Devolución

```text
Frontend
→ Selecciona préstamo activo
→ Solicita devolución
→ Library valida JWT
→ Marca Loan como devuelto
→ Marca el libro como disponible
→ Frontend actualiza la información
```

### Estadísticas iniciales

```text
Statistics
→ Consume Books y Loans desde Library
→ Calcula totales propios
→ Devuelve estadísticas
→ Frontend muestra el resumen
```

## Alcance del Sprint

### Must have

- CRUD completo de libros.
- Persistencia de libros en MongoDB.
- Modelo Loan.
- Registro de préstamos.
- Registro de devoluciones.
- Consulta de préstamos.
- Actualización de disponibilidad del libro.
- JWT en operaciones protegidas de Library.
- JWT en Statistics.
- Frontend conectado con Library y Statistics.
- Interfaz básica para administrar libros.
- Interfaz básica para préstamos y devoluciones.
- Estadísticas iniciales basadas en datos reales.
- Pull Requests e integración en `main`.
- Proyecto funcional al cerrar el Sprint.

### Should have

- Filtros simples de libros por título, autor o categoría.
- Confirmación antes de eliminar.
- Indicadores de carga y errores comprensibles.
- Visualización separada de préstamos activos y devueltos.
- Prevención de doble préstamo del mismo libro.
- Respuesta 409 para conflictos de disponibilidad o estado.

### Won't have durante este Sprint

- Recomendaciones con Gemini.
- Recomendaciones completas por categoría.
- Estadísticas finales por categoría.
- Resumen final completo de la biblioteca.
- Cloudinary y carga de portadas.
- Swagger.
- Docker como entregable del proyecto.
- Recuperación de contraseña.
- Refresh tokens.
- Roles complejos.
- Animaciones o rediseño visual final.
- Multas, reservas o cron de préstamos vencidos.

## Contratos mínimos a congelar

Los siguientes contratos deben copiarse también a `docs/contracts.md` antes de generar prompts para los agentes.

### Autorización

Las rutas protegidas aceptan:

```http
Authorization: Bearer <jwt>
```

El JWT debe verificarse con:

- `JWT_SECRET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`

Cuando sea válido, el middleware agrega:

```js
req.userId
req.userRole
```

Errores:

- Sin token: `401`.
- Token inválido o expirado: `401`.
- Operación no permitida: `403`.

### Crear libro

```http
POST /api/v1/books
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "title": "Cien años de soledad",
  "author": "Gabriel García Márquez",
  "category": "Novela",
  "year": 1967
}
```

El servidor crea el libro con `available: true` siempre; el cliente no puede controlar `available` (no forma parte del body aceptado). Los Books conservan `_id` nativo de Mongoose; no se transforma a `id`.

Respuesta exitosa: `201`.

### Editar libro

```http
PUT /api/v1/books/:id
Authorization: Bearer <jwt>
Content-Type: application/json
```

Acepta únicamente campos permitidos del modelo Book: `title`, `author`, `category`, `year`. No puede modificar `available`, `_id`, `createdAt` ni `updatedAt`.

Respuesta exitosa: `200`.

### Eliminar libro

```http
DELETE /api/v1/books/:id
Authorization: Bearer <jwt>
```

Respuesta exitosa: `200`.

El borrado es físico (hard delete), no soft delete. Responde `404` si el libro no existe. No puede eliminarse un libro con un préstamo activo. En ese caso responde `409`.

### Consultar libros

```http
GET /api/v1/books
```

Filtros opcionales:

```text
?title=
?author=
?category=
```

La respuesta conserva:

```json
{
  "success": true,
  "message": "Libros obtenidos correctamente",
  "data": {
    "items": [],
    "total": 0
  }
}
```

### Modelo Loan

Campos mínimos:

- `bookId`: ObjectId del libro.
- `borrowerName`: nombre del prestatario.
- `dueDate`: fecha límite.
- `loanDate`: fecha de creación, default actual.
- `returnedAt`: fecha o null.
- `status`: `ACTIVE` o `RETURNED`.
- `createdBy`: `sub` del JWT.
- `timestamps: true`.
- `versionKey: false`.

### Registrar préstamo

```http
POST /api/v1/loans
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "bookId": "mongo-object-id",
  "borrowerName": "Ana López",
  "dueDate": "2026-08-01T00:00:00.000Z"
}
```

Reglas:

- El libro debe existir.
- Debe estar disponible.
- `dueDate` debe ser posterior a la fecha actual.
- Se crea el préstamo con estado `ACTIVE`.
- El libro queda con `available: false`.
- Si no está disponible, responde `409`.

Respuesta exitosa: `201`.

### Consultar préstamos

```http
GET /api/v1/loans
Authorization: Bearer <jwt>
```

Filtro opcional:

```text
?status=ACTIVE
?status=RETURNED
```

Respuesta:

```json
{
  "success": true,
  "message": "Préstamos obtenidos correctamente",
  "data": {
    "items": [],
    "total": 0
  }
}
```

### Registrar devolución

```http
POST /api/v1/returns
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "loanId": "mongo-object-id"
}
```

Reglas:

- El préstamo debe existir.
- Debe tener estado `ACTIVE`.
- Cambia a `RETURNED`.
- Guarda `returnedAt`.
- El libro relacionado vuelve a `available: true`.
- Una segunda devolución responde `409`.

Respuesta exitosa: `200`.

### Estadísticas iniciales

```http
GET /api/v1/statistics
Authorization: Bearer <jwt>
```

`GET /api/v1/summary` permanece **público** y conserva el contrato del Sprint 1 (no requiere JWT). `GET /api/v1/statistics` es el único endpoint nuevo de Statistics protegido con JWT.

Statistics consume Library y calcula:

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

Statistics no puede limitarse a reenviar las respuestas de Library.

## Archivos compartidos reservados para integración

Para reducir conflictos, únicamente el responsable de integración modifica estos archivos durante el Sprint:

```text
docs/contracts.md
docs/handoff.md
service-library/configs/app.js
service-statistics/configs/app.js
frontend/src/router/**
frontend/src/layouts/**
frontend/src/App.jsx
package.json de la raíz
scripts/**
README.md
```

Los agentes de features deben crear sus módulos sin modificar esos archivos. El responsable de integración los conecta durante la fase de merge.

## Backlog del Sprint 2

### S2-00 — Cierre de seguridad previo al Sprint

**Responsable recomendado:** Scrum Master.

**Estado: DIFERIDO por decisión expresa del Scrum Master.** No está cerrado, aprobado, solucionado ni verificado. El Sprint 2 continúa bajo riesgo aceptado mientras esta tarea permanezca pendiente.

**No consume tiempo de implementación del Sprint si puede resolverse antes.**

Resultado:

- Rotar credenciales expuestas.
- Revocar credenciales anteriores.
- Purgar el historial Git o crear un remoto limpio.
- Confirmar que `.env` está ignorado.
- Registrar la acción en `docs/handoff.md`.

Criterio:

- El Sprint 2 no se abre con secretos activos expuestos.
- Mientras S2-00 no se resuelva, el veredicto máximo del Sprint 2 es `APROBADO CON OBSERVACIONES`; no puede declararse `APROBADO` sin observaciones.

---

### S2-01 — Middleware JWT de Library

**Dificultad:** media.  
**Carpeta permitida:** `service-library/middlewares/**`.

Resultado:

- Crear `validate-jwt.js`.
- Leer token desde `Authorization: Bearer` y opcionalmente `x-token`.
- Verificar secreto, issuer y audience.
- Inyectar `req.userId` y `req.userRole`.
- Responder 401 sin token o con token inválido.
- No modificar las rutas todavía.

No modificar:

- `src/books/**`
- `src/loans/**`
- `configs/app.js`

---

### S2-02 — CRUD completo de Books

**Dificultad:** media.  
**Carpeta permitida:** `service-library/src/books/**`.

Resultado:

- `POST /books`.
- `PUT /books/:id`.
- `DELETE /books/:id`.
- Mantener `GET /books`.
- Añadir búsqueda por título, autor o categoría.
- Validar body, params y filtros.
- Evitar campos no permitidos.
- Preparar las rutas para utilizar `validateJWT` en mutaciones.
- Impedir borrar libros con préstamo activo después de la integración con Loans.

No modificar:

- `configs/app.js`
- `src/loans/**`
- frontend
- Statistics

---

### S2-03 — Loans y Returns

**Dificultad:** alta.  
**Carpeta permitida:** `service-library/src/loans/**`.

Resultado:

- Crear modelo Loan.
- `GET /loans`.
- `POST /loans`.
- `POST /returns`.
- Validar libro, disponibilidad y fechas.
- Cambiar `Book.available` al prestar y devolver.
- Evitar doble préstamo.
- Evitar doble devolución.
- Usar respuestas 404 y 409 apropiadas.
- Preparar rutas protegidas con `validateJWT`.

No modificar:

- `configs/app.js`
- `src/books/**`, salvo importar el modelo Book desde Loans.
- frontend
- Statistics

---

### S2-04 — Middleware JWT de Statistics

**Dificultad:** baja-media.  
**Carpeta permitida:** `service-statistics/middlewares/**`.

Resultado:

- Implementar validación JWT con el mismo contrato de Library.
- Inyectar `req.userId` y `req.userRole`.
- No modificar todavía rutas ni controllers.

---

### S2-05 — Estadísticas iniciales basadas en Books y Loans

**Dificultad:** media.  
**Carpeta permitida:** `service-statistics/src/statistics/**`.

Resultado:

- Mantener `/summary`.
- Añadir `GET /statistics`.
- Consumir:
  - `GET Library /books`
  - `GET Library /loans`
- Reenviar el JWT recibido a Library cuando el endpoint consumido sea protegido.
- Calcular totales propios.
- Conservar timeout.
- Validar contratos externos.
- Responder 503 si Library falla.
- Preparar la ruta para utilizar el middleware JWT.

No modificar:

- `configs/app.js`
- frontend
- Library

---

### S2-06 — Cliente HTTP autenticado del Frontend

**Dificultad:** media.  
**Carpeta permitida:** `frontend/src/api/**`.

Resultado:

- Crear o actualizar una instancia Axios compartida.
- Adjuntar automáticamente el JWT a Library y Statistics.
- Crear funciones para:
  - listar libros;
  - crear libro;
  - editar libro;
  - eliminar libro;
  - listar préstamos;
  - registrar préstamo;
  - registrar devolución;
  - consultar estadísticas.
- Mantener Auth funcionando.
- Normalizar errores sin ocultar mensajes del servidor.

No modificar:

- páginas;
- router;
- layout;
- componentes visuales.

---

### S2-07 — Interfaz de administración de Books

**Dificultad:** media.  
**Carpetas permitidas:**

```text
frontend/src/features/books/**
frontend/src/pages/BooksPage.jsx
```

Resultado:

- Listar libros.
- Buscar por título, autor o categoría.
- Crear libro.
- Editar libro.
- Eliminar libro con confirmación.
- Mostrar disponibilidad.
- Estados loading, empty y error.
- Consumir las funciones de `frontend/src/api/**`.
- Respetar el sistema visual existente.

No modificar:

- router;
- layout global;
- Loans;
- Statistics;
- backend.

---

### S2-08 — Interfaz de Loans y Returns

**Dificultad:** media.  
**Carpetas permitidas:**

```text
frontend/src/features/loans/**
frontend/src/pages/LoansPage.jsx
```

Resultado:

- Mostrar préstamos activos y devueltos.
- Registrar un préstamo.
- Permitir elegir únicamente libros disponibles.
- Registrar devolución.
- Actualizar la vista después de cada operación.
- Estados loading, empty y error.
- Consumir el cliente API compartido.

No modificar:

- router;
- layout global;
- Books;
- Statistics;
- backend.

---

### S2-09 — Interfaz de estadísticas iniciales

**Dificultad:** baja-media.  
**Carpetas permitidas:**

```text
frontend/src/features/statistics/**
frontend/src/components/statistics/**
```

Resultado:

- Consumir `GET /statistics`.
- Mostrar:
  - total de libros;
  - libros disponibles;
  - préstamos totales;
  - préstamos activos;
  - préstamos devueltos.
- Incluir estados loading y error.
- Entregar un componente integrable; no modificar `AppPage.jsx` ni el router.

---

### S2-10 — Integración, navegación y smoke test

**Responsable recomendado:** Scrum Master con Fable 5.  
**Dificultad:** alta.

Resultado:

- Montar Loans en `service-library/configs/app.js`.
- Aplicar JWT a mutaciones de Books, Loans y Returns.
- Montar y proteger `/statistics`.
- Integrar páginas en router y navegación.
- Integrar componente Statistics en la pantalla correspondiente.
- Resolver conflictos.
- Actualizar variables `.env.example`.
- Añadir o actualizar `scripts/smoke-sprint-2.mjs`.
- Ejecutar flujo real de extremo a extremo.
- Actualizar README y handoff.

El smoke test debe comprobar:

1. Login y obtención de JWT.
2. Crear libro con JWT.
3. Editar libro.
4. Consultar libros.
5. Crear préstamo.
6. Confirmar libro no disponible.
7. Consultar préstamos.
8. Consultar Statistics.
9. Registrar devolución.
10. Confirmar libro disponible.
11. Eliminar libro.
12. Confirmar respuestas 401 sin JWT.
13. Confirmar conflictos 409.
14. Confirmar que los tres servicios permanecen activos.

## Reparto recomendado por capacidad

| Perfil | Tareas apropiadas |
|---|---|
| Scrum Master / integración | S2-00, S2-01 o S2-04, S2-10 |
| Backend más fuerte | S2-03 |
| Backend intermedio | S2-02 o S2-05 |
| Frontend | S2-06, S2-07, S2-08 o S2-09 |
| Integrante con menor experiencia | S2-04, S2-09, pruebas manuales y evidencia |

Una persona puede asumir más de una tarea, pero no debe tener más de una tarea en `In Progress` al mismo tiempo.

## Dependencias

```text
S2-01 → integración de protección en Library
S2-02 → S2-07
S2-03 → S2-05 y S2-08
S2-04 → integración de protección en Statistics
S2-05 → S2-09
S2-06 → S2-07, S2-08 y S2-09
S2-02 + S2-03 + S2-05 + S2-06 + S2-07 + S2-08 + S2-09 → S2-10
```

Los agentes pueden desarrollar contra los contratos congelados aunque la dependencia real todavía no haya sido integrada.

## Ramas sugeridas

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

Cada integrante debe trabajar en su propia rama y realizar commits propios.

## Distribución de tiempo

| Minutos | Actividad |
|---|---|
| 0–10 | Planning, contratos, asignación y ramas |
| 10–55 | Implementación paralela |
| 55–65 | Revisión rápida y primeros Pull Requests |
| 65–78 | Integración y correcciones |
| 78–85 | Smoke test y prueba del frontend |
| 85–90 | Review, retrospectiva y actualización del handoff |

## Definition of Ready

Una tarea puede entrar a `In Progress` cuando:

- Tiene responsable.
- Tiene archivos permitidos y prohibidos.
- Sus contratos están en `docs/contracts.md`.
- Sus dependencias están identificadas.
- Tiene criterios de aceptación.
- El agente leyó `docs/sprint-2.md`, `docs/contracts.md` y `docs/handoff.md`.

## Definition of Done

Una tarea está terminada cuando:

- Cumple sus criterios.
- Respeta contratos.
- No modifica archivos prohibidos.
- Pasa comprobación sintáctica.
- Sus endpoints o componentes fueron probados.
- Incluye reporte de archivos y comandos.
- Tiene commit propio.
- Tiene Pull Request.
- Otro integrante la revisó.
- No introduce secretos.
- Está integrada y probada desde `main`.

## Criterios de cierre del Sprint

El Sprint 2 se aprueba únicamente cuando:

- El CRUD de libros funciona.
- Los préstamos y devoluciones persisten.
- La disponibilidad cambia correctamente.
- JWT protege las operaciones definidas.
- Statistics calcula datos de Books y Loans.
- El frontend puede ejecutar el flujo principal.
- `pnpm build` y `pnpm lint` pasan.
- El smoke test del Sprint 2 pasa.
- Todos los integrantes tienen commits.
- Los Pull Requests están integrados.
- `main` permanece funcional.
- `docs/handoff.md` refleja el estado real.

## Review

Demostración mínima:

1. Iniciar sesión.
2. Crear un libro.
3. Editarlo.
4. Registrar un préstamo.
5. Mostrar que dejó de estar disponible.
6. Consultar estadísticas.
7. Registrar devolución.
8. Mostrar que volvió a estar disponible.
9. Eliminar el libro.
10. Mostrar rechazo de una petición protegida sin JWT.

## Retrospectiva

Responder:

- ¿Qué se terminó?
- ¿Qué bloqueó la integración?
- ¿Qué contratos cambiaron?
- ¿Qué se moverá al Sprint 3?
- ¿Qué acción concreta mejorará el siguiente Sprint?

El Sprint 3 se planifica después de esta Review.
