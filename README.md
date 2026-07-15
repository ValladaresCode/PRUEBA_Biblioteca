# Biblioteca App

Sistema de gestión bibliotecaria desarrollado con arquitectura distribuida (Sprint 1 en curso).

## Estructura del monorepo

| Carpeta | Descripción | Puerto |
| --- | --- | --- |
| `frontend/` | Interfaz web en React (Vite) | 5173 |
| `service-auth/` | Servicio de autenticación (registro, login, JWT) | 4000 |
| `service-library/` | Servicio de gestión de biblioteca (libros) | 4001 |
| `service-statistics/` | Servicio de estadísticas y recomendaciones | 4002 |

Documentación compartida en [docs/contracts.md](docs/contracts.md) (contratos congelados),
[docs/sprint-1.md](docs/sprint-1.md) (alcance del sprint) y [docs/handoff.md](docs/handoff.md) (estado real).

## Requisitos

- Node.js 22+
- pnpm
- PostgreSQL en `localhost:5432` (usado por `service-auth`)
- MongoDB en `localhost:27017` (usado por `service-library`)

Antes de arrancar Auth, crea su base de datos: `CREATE DATABASE biblioteca_auth;`

## Instalación

```bash
pnpm install
```

## Configuración

Cada servicio tiene su propio `.env`. Copiar el ejemplo y completar los valores:

```bash
cp service-auth/.env.example service-auth/.env
```

Ver las variables de cada servicio en `docs/contracts.md` y en `.env.example` de la raíz.

## Ejecución

```bash
# Servicio de autenticación (http://localhost:4000)
pnpm --filter biblioteca-auth-service dev

# Frontend (http://localhost:5173)
pnpm --filter gestor-biblioteca dev
```

## Verificación rápida de Auth

```bash
curl http://localhost:4000/health

curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana López","email":"ana@example.com","password":"12345678"}'

curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"12345678"}'
```

## Reglas de trabajo

- Nadie desarrolla directamente sobre `main`; cada integrante usa su propia rama.
- Los contratos de `docs/contracts.md` están congelados: no cambiar rutas, campos ni formatos sin avisar al Scrum Master.
- Nunca subir archivos `.env` ni secretos reales al repositorio.
