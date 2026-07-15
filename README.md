# Biblioteca App

Sistema de gestión bibliotecaria con arquitectura distribuida (monorepo pnpm). Entrega del **Sprint 1**.

## Estructura del monorepo

| Carpeta | Paquete (pnpm) | Descripción | Puerto | Persistencia |
| --- | --- | --- | --- | --- |
| `frontend/` | `gestor-biblioteca` | Interfaz web React + Vite + Tailwind + Zustand | 5173 | — |
| `service-auth/` | `biblioteca-auth-service` | Registro, login y emisión de JWT | 4000 | PostgreSQL + Sequelize |
| `service-library/` | `service-library` | Catálogo de libros (`GET /api/v1/books`) | 4001 | MongoDB + Mongoose |
| `service-statistics/` | `service-statistics` | Resumen (`GET /api/v1/summary`), consume Library por HTTP | 4002 | — |

Documentación: [docs/contracts.md](docs/contracts.md) (contratos congelados — fuente de verdad),
[docs/sprint-1.md](docs/sprint-1.md) (alcance), [docs/handoff.md](docs/handoff.md) (estado real),
[docs/integration-sprint-1.md](docs/integration-sprint-1.md) (informe de integración).

## Requisitos

- Node.js 22+
- pnpm 10+
- PostgreSQL 5432 (para `service-auth`)
- MongoDB 27017 (para `service-library`)

## 1. Instalación (desde la raíz)

```bash
pnpm install
```

Un único lockfile en la raíz (`pnpm-lock.yaml`) representa los cuatro proyectos. No usar npm ni yarn.

## 2. Bases de datos

### PostgreSQL (Auth)

Crea la base de datos que usará Auth:

```sql
CREATE DATABASE biblioteca_auth;
```

> Alternativa con Docker (si no tienes la contraseña de tu PostgreSQL local): un contenedor
> dedicado en el puerto **5434** con la base ya creada. Es solo infraestructura local de
> prueba; **no** forma parte del entregable (no hay Dockerfile ni docker-compose en el repo).
>
> ```bash
> docker run -d --name biblioteca-auth-db \
>   -e POSTGRES_PASSWORD=root -e POSTGRES_DB=biblioteca_auth \
>   -p 5434:5432 postgres:16
> ```
>
> Y en `service-auth/.env`: `DATABASE_URL=postgresql://postgres:root@localhost:5434/biblioteca_auth`

### MongoDB (Library)

Asegúrate de tener MongoDB escuchando en `localhost:27017`. La base `biblioteca_library` se
crea automáticamente al insertar el primer libro.

## 3. Variables de entorno

Cada subproyecto tiene un `.env.example`. Copia y ajusta (los `.env` reales están ignorados por Git):

```bash
cp service-auth/.env.example        service-auth/.env
cp service-library/.env.example     service-library/.env
cp service-statistics/.env.example  service-statistics/.env
cp frontend/.env.example            frontend/.env
```

| Servicio | Variables |
| --- | --- |
| Auth | `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `NODE_ENV` |
| Library | `PORT`, `URI_MONGO`, `NODE_ENV` |
| Statistics | `PORT`, `SERVICE_LIBRARY_URL`, `NODE_ENV` |
| Frontend | `VITE_AUTH_API_URL`, `VITE_LIBRARY_API_URL`, `VITE_STATISTICS_API_URL` |

> ⚠️ **Nunca subas secretos ni archivos `.env` al repositorio.** Solo se versionan los `.env.example` con valores de ejemplo.

## 4. Ejecución

### Orden recomendado de arranque

1. PostgreSQL
2. MongoDB
3. Auth
4. Library
5. Statistics
6. Frontend

### Por servicio (una terminal cada uno)

```bash
pnpm dev:auth        # http://localhost:4000
pnpm dev:library     # http://localhost:4001
pnpm dev:statistics  # http://localhost:4002
pnpm dev:frontend    # http://localhost:5173
```

### Todo junto (en paralelo)

```bash
pnpm dev
```

## 5. Verificación

### Health checks

```bash
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
```

### Registro y login (Auth)

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Lopez","email":"ana@example.com","password":"12345678"}'

curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"12345678"}'
```

### Libros (Library)

```bash
curl http://localhost:4001/api/v1/books
```

Para poblar datos de prueba: `pnpm --filter service-library seed` (ver Fase de Library).

### Resumen (Statistics)

```bash
curl http://localhost:4002/api/v1/summary
```

### Smoke test automatizado

Con los cuatro servicios activos:

```bash
pnpm smoke:sprint1
```

Imprime PASS/FAIL por prueba y termina con código 0 si todo pasa.

## Reglas de trabajo

- Nadie desarrolla directamente sobre `main`; cada integrante usa su propia rama.
- Los contratos de `docs/contracts.md` están congelados: no cambiar rutas, campos, puertos ni formatos sin avisar al Scrum Master.
- Nunca subir archivos `.env` ni secretos reales.
