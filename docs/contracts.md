Contratos compartidos — Sprint 1
Este documento contiene los contratos congelados del Sprint 1.
Ningún integrante o agente puede cambiar rutas, nombres de campos, puertos o formatos de respuesta sin comunicarlo primero al Scrum Master.
1. Puertos
Aplicación	Puerto
Frontend	5173
Auth Service	4000
Library Service	4001
Statistics Service	4002
2. Prefijo de API
Todos los servicios utilizarán:
/api/v1
3. Formato común de éxito
{
  "success": true,
  "message": "Operación completada",
  "data": {}
}
4. Formato común de error
{
  "success": false,
  "message": "Descripción comprensible del error",
  "errors": []
}
El campo errors puede omitirse cuando no existen errores de validación individuales.
5. Registro de usuario
POST http://localhost:4000/api/v1/auth/register
Content-Type: application/json
Body:
{
  "name": "Ana López",
  "email": "ana@example.com",
  "password": "12345678"
}
Respuesta exitosa:
{
  "success": true,
  "message": "Usuario registrado correctamente",
  "data": {
    "user": {
      "id": "string",
      "name": "Ana López",
      "email": "ana@example.com",
      "role": "LIBRARIAN_ROLE"
    }
  }
}
6. Inicio de sesión
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json
Body:
{
  "email": "ana@example.com",
  "password": "12345678"
}
Respuesta exitosa:
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "jwt",
    "user": {
      "id": "string",
      "name": "Ana López",
      "email": "ana@example.com",
      "role": "LIBRARIAN_ROLE"
    }
  }
}
7. Payload mínimo del JWT
{
  "sub": "userId",
  "role": "LIBRARIAN_ROLE"
}
El token utilizará también:
JWT_SECRET
JWT_ISSUER
JWT_AUDIENCE
fecha de expiración
8. Consultar libros
GET http://localhost:4001/api/v1/books
Respuesta:
{
  "success": true,
  "message": "Libros obtenidos correctamente",
  "data": {
    "items": [],
    "total": 0
  }
}
Durante el Sprint 1 este endpoint puede ser público.
9. Resumen de biblioteca
GET http://localhost:4002/api/v1/summary
Respuesta:
{
  "success": true,
  "message": "Resumen generado correctamente",
  "data": {
    "totalBooks": 0,
    "availableBooks": 0,
    "categories": 0,
    "latestBooks": []
  }
}
Statistics debe calcular esta respuesta a partir de los libros obtenidos desde Library. No puede limitarse a reenviar la respuesta original.
10. Variables del frontend
VITE_AUTH_API_URL=http://localhost:4000/api/v1
VITE_LIBRARY_API_URL=http://localhost:4001/api/v1
VITE_STATISTICS_API_URL=http://localhost:4002/api/v1
11. Variables de Auth
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/biblioteca_auth
JWT_SECRET=replace_with_a_secure_secret
JWT_ISSUER=biblioteca-auth
JWT_AUDIENCE=biblioteca-services
JWT_EXPIRES_IN=2h
12. Variables de Library
PORT=4001
URI_MONGO=mongodb://localhost:27017/biblioteca_library
13. Variables de Statistics
PORT=4002
SERVICE_LIBRARY_URL=http://localhost:4001
---

# Contratos congelados — Sprint 2

Esta sección congela los contratos funcionales del Sprint 2. Los contratos del Sprint 1 (secciones 1 a 13 arriba) permanecen vigentes sin cambios; esta sección los amplía, no los reemplaza.

**Estado:** congelado para desarrollo en paralelo. La apertura funcional real del Sprint 2 depende de que S2-00 (rotación y purga de credenciales) se resuelva; ver `docs/handoff.md`. Mientras S2-00 siga pendiente, el veredicto máximo del proyecto es `APROBADO CON OBSERVACIONES`.

## S2.1 Convención común

Se reutiliza la convención de éxito/error de la sección 3 y 4. `errors` puede omitirse cuando no existan errores de validación detallados.

## S2.2 JWT

Header oficial:

```http
Authorization: Bearer <jwt>
```

Library y Statistics deben validar:

- `JWT_SECRET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- expiración

El middleware inyecta:

```js
req.userId
req.userRole
```

Estados:

- `401`: token ausente.
- `401`: formato Bearer incorrecto.
- `401`: token inválido.
- `401`: token expirado.
- `403`: token válido, pero rol no autorizado.

Las mutaciones de Books, Loans y Returns requieren `LIBRARIAN_ROLE`. Actualmente Auth crea usuarios con ese rol por defecto.

## S2.3 Books

Endpoints:

```http
GET    /api/v1/books
POST   /api/v1/books
PUT    /api/v1/books/:id
DELETE /api/v1/books/:id
```

Protección:

- `GET /books`: público (se conserva del Sprint 1).
- `POST /books`: JWT y `LIBRARIAN_ROLE`.
- `PUT /books/:id`: JWT y `LIBRARIAN_ROLE`.
- `DELETE /books/:id`: JWT y `LIBRARIAN_ROLE`.

Filtros opcionales de `GET /books` (parciales y case-insensitive):

```text
?title=
?author=
?category=
```

Los Books conservan la estructura nativa de Mongoose y utilizan `_id`. No se introduce una transformación global de `_id` a `id`.

Body de creación:

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "category": "Programación",
  "year": 2008
}
```

El servidor siempre crea el libro con `available: true`. El cliente **no** puede controlar `available` (el body de creación no incluye ni acepta ese campo).

`PUT /books/:id` puede modificar exclusivamente: `title`, `author`, `category`, `year`.
`PUT /books/:id` **no** puede modificar: `available`, `_id`, `createdAt`, `updatedAt`.

`DELETE /books/:id`:

- Es borrado físico (hard delete), no soft delete.
- Responde `404` si el libro no existe.
- Responde `409` si existe un Loan con estado `ACTIVE` para ese libro.
- Puede eliminarse cuando no tiene Loan activo.

## S2.4 Loans y Returns

Endpoints:

```http
GET  /api/v1/loans
POST /api/v1/loans
POST /api/v1/returns
```

Todos requieren JWT. `POST /loans` y `POST /returns` requieren además `LIBRARIAN_ROLE`.

`GET /loans` puede filtrar:

```text
?status=ACTIVE
?status=RETURNED
```

Body de préstamo:

```json
{
  "bookId": "mongo-object-id",
  "borrowerName": "Ana Pérez",
  "dueDate": "2026-07-30"
}
```

Body de devolución:

```json
{
  "loanId": "mongo-object-id"
}
```

Campos mínimos del modelo Loan: `bookId`, `borrowerName`, `dueDate`, `loanDate`, `returnedAt`, `status`, `createdBy`, `createdAt`, `updatedAt`.

Valores de `status` permitidos: `ACTIVE`, `RETURNED`.

El cliente no puede definir `loanDate`, `returnedAt`, `status` ni `createdBy`.

Reglas:

- El libro debe existir.
- El libro debe estar disponible.
- `dueDate` debe ser futura.
- `loanDate` se genera en el servidor.
- `createdBy` se obtiene de `req.userId`.
- Loan nuevo inicia como `ACTIVE`.
- Al prestar, Book cambia a `available: false`.
- Al devolver, Loan cambia a `RETURNED`.
- Al devolver, se completa `returnedAt`.
- Al devolver, Book cambia a `available: true`.
- Doble préstamo devuelve `409`.
- Doble devolución devuelve `409`.
- ObjectId inválido devuelve `400`.
- Entidad inexistente devuelve `404`.

Notas de implementación esperadas (a resolver por la tarea de implementación, no por esta congelación):

- Actualización atómica de Book condicionada por `available: true`.
- Índice único parcial para impedir dos Loans `ACTIVE` del mismo libro.
- Compensación para restaurar el Book si falla la creación del Loan después de reservarlo.

## S2.5 Statistics

Se conserva:

```http
GET /api/v1/summary
```

`GET /summary` permanece **público** y conserva el contrato del Sprint 1 (sección 9).

Se añade:

```http
GET /api/v1/statistics
Authorization: Bearer <jwt>
```

Respuesta:

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

Statistics:

- Valida su propio JWT en `/statistics` (protegido); `/summary` sigue sin JWT.
- Consume `/api/v1/books` y `/api/v1/loans` de Library.
- Reenvía el header `Authorization` a Library cuando el endpoint consumido es protegido.
- Usa `fetch` nativo con timeout.
- Valida las respuestas externas.
- Calcula las cinco métricas (no reenvía respuestas de Library sin procesar).
- No posee base de datos propia.
- Responde `503` si Library no está disponible o rompe el contrato.

## S2.6 Frontend

Variables (sin cambios respecto a la sección 10):

```env
VITE_AUTH_API_URL=http://localhost:4000/api/v1
VITE_LIBRARY_API_URL=http://localhost:4001/api/v1
VITE_STATISTICS_API_URL=http://localhost:4002/api/v1
```

Exportaciones mínimas esperadas del cliente HTTP (documentación de contrato; implementación fuera de S2-00B):

```js
listBooks(filters)
createBook(payload)
updateBook(id, payload)
deleteBook(id)

listLoans(status)
createLoan(payload)
returnLoan(loanId)

getStatistics()
getApiErrorMessage(error)
```

No se cambia la interfaz pública existente de `registerUser()` ni `loginUser()`.

## S2.7 Variables de entorno compartidas (JWT)

Auth, Library y Statistics comparten:

```text
JWT_SECRET
JWT_ISSUER
JWT_AUDIENCE
```

Los puertos no cambian: Auth 4000, Library 4001, Statistics 4002, Frontend 5173.

---

Regla de modificación
Antes de modificar un contrato:
Detener la tarea afectada.
Informar al Scrum Master.
Revisar qué otros componentes dependen del contrato.
Actualizar este documento.
Informar a los demás integrantes.