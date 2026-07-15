# Guía de Arquitectura del Backend de Gestión (Blueprint)

> **Propósito de este documento.** Describe, a nivel de **contratos y patrones** (no de nombres de clases del dominio bancario original), la arquitectura de un backend Express 5 + Mongoose que otro agente debe **replicar** para un sistema de **Gestión Bibliotecaria**. Aquí no se prescriben los nombres de entidades del dominio (libros, socios, préstamos, reservas, multas, etc.): se prescribe **cómo se estructura el proyecto, qué hace cada capa, qué contrato expone cada middleware y cómo se comunican las piezas**. Al final de cada sección hay una nota **"→ Biblioteca"** que traduce el patrón al nuevo dominio.

---

## 0. Stack y decisiones base

| Elemento | Elección | Notas de contrato |
|---|---|---|
| Runtime | Node.js (imagen `node:22-alpine` en Docker) | — |
| Módulos | **ESM puro** (`"type": "module"` en `package.json`) | Se usa `import`/`export`, **no** `require`. Habilita `await` de nivel superior en el entrypoint. |
| Framework HTTP | **Express 5** | No Express 4 (cambia el manejo de errores async y algunos comportamientos de rutas). |
| Base de datos | **MongoDB** vía **Mongoose** (ODM) | Un modelo por entidad; relaciones normalmente **por valor de negocio** (guardar un `userId`/identificador string), no por `ObjectId ref`, salvo el ledger de eventos. |
| Autenticación | **JWT verificado, NO emitido aquí** | Este backend es un microservicio que solo **valida** tokens emitidos por un **AuthService externo** independiente. Comparte con él `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`. |
| Gestor de paquetes | **pnpm** (vía corepack en Docker) | — |
| Validación | **express-validator** | Cadenas de validación declarativas como arrays de middleware. |
| Uploads | **multer + multer-storage-cloudinary + cloudinary** | Sube imágenes directo a Cloudinary, sin disco local. |
| Docs | **swagger-jsdoc + swagger-ui-express** | Definición central inline + escaneo de JSDoc en `*.routes.js`. |
| Logging | **morgan** (`"dev"`) | — |
| Seguridad HTTP | **helmet** + **cors** | Ver nota de "config definida pero no cableada" abajo. |

### Dependencias de producción típicas
`express`, `mongoose`, `mongodb`, `cors`, `helmet`, `morgan`, `jsonwebtoken`, `express-validator`, `multer`, `multer-storage-cloudinary`, `cloudinary`, `dotenv`, `swagger-jsdoc`, `swagger-ui-express`, `uuid`, `node-fetch` (para llamar APIs externas y al AuthService). **devDependencies:** `nodemon`.

Scripts en `package.json`:
- `start`: `node index.js`
- `dev`: `nodemon index.js`
- `test`: placeholder (no hay suite de tests).

---

## 1. Estructura de carpetas

```
<backend>/
├── index.js                     # Entrypoint: conecta BD, arranca cron, listen()
├── package.json                 # "type": "module", scripts, deps
├── Dockerfile / .dockerignore
├── .env.example                 # Contrato de variables de entorno
│
├── configs/                     # Ensamblado y configuración transversal
│   ├── app.js                   # Arma Express: middlewares globales, montaje de routers, error handlers. Exporta `app` (NO llama listen)
│   ├── db.js                    # Conexión Mongo + graceful shutdown. Exporta `dbConnection`
│   ├── swagger.js               # Spec OpenAPI. Exporta el spec compilado
│   ├── cors-configuration.js    # Exporta `corsOptions` (objeto de config)
│   └── helmet-configuration.js  # Exporta `helmetConfiguration` (objeto de config)
│
├── middlewares/                 # Middlewares transversales (auth, validación, uploads, gates de negocio)
│   ├── validate-JWT.js          # `validateJWT` (autenticación) + `isAdmin` (autorización)
│   ├── validate-ClientRole.js   # `validateClientRole` (autorización rol cliente)
│   ├── validate-UserJWT.js      # `validateUserFromBody` (identifica 2º sujeto vía token en body)
│   ├── file-uploader.js         # multer+cloudinary → `uploadFieldImage`
│   ├── parseFormData.js         # multer().none() → parsea form-data sin archivos
│   ├── parse-json-fields.js     # factory: des-serializa campos JSON stringificados
│   ├── allowed-fields.js        # arrays whitelist de campos por entidad (no es middleware)
│   ├── <entidad>-validators.js  # cadenas express-validator + whitelist por entidad
│   ├── check<Entidad>Eligibility.js  # gate de negocio (enriquece req.<entidad>)
│   └── <regla-puntual>.js       # middlewares de reglas de negocio específicas
│
├── helpers/                     # Lógica de negocio pura y jobs
│   ├── <dominio>-logic.js       # lógica sin modelo (ej. cálculo/consulta externa)
│   └── <estado>-status-cron.js  # cron con setInterval para transiciones por fecha
│
├── seeds/                       # JSON de datos semilla por entidad
│   └── seed_*.json
│
└── src/                         # Un folder por FEATURE (dominio)
    └── <feature>/
        ├── <feature>.model.js           # Schema Mongoose
        ├── <feature>-request.model.js   # (opcional) modelo de solicitud con workflow admin
        ├── <feature>.controller.js      # funciones async (req,res) exportadas nombradas
        ├── <feature>.routes.js          # Router() con middlewares encadenados por ruta
        ├── <feature>.service.js         # (opcional) capa de integración externa (LLM, etc.)
        └── system-prompt.js             # (opcional, sólo chatbot)
```

**Regla de oro para añadir una feature:** crear la carpeta `src/<feature>/` con su tríada `model/controller/routes` (+ opcionales) y **montar su router** en `configs/app.js` bajo el prefijo común.

→ **Biblioteca:** las features serían `books`, `members` (o `readers`), `loans`, `reservations`, `categories`, `fines`, `chatbot`, etc. El backend de "gestión" es el cliente de un **AuthService de biblioteca** separado que emite los JWT.

---

## 2. Entrypoint — `index.js`

**Contrato (orden EXACTO):**
1. `import "dotenv/config";` como **primer import** (carga `.env` por efecto secundario antes que nada).
2. Importar `app` desde `configs/app.js`, `dbConnection` desde `configs/db.js`, y el arrancador del cron desde `helpers/`.
3. `const PORT = process.env.PORT || 3000;`
4. `await dbConnection();` — **top-level await**: conecta a Mongo **antes** de escuchar.
5. Arrancar el cron **después** de conectar (depende de la conexión).
6. `app.listen(PORT, ...)`.

No exporta nada. **Patrón clave:** BD lista → cron → escuchar.

→ **Biblioteca:** el cron pasa de "mantener estado de promociones" a, por ejemplo, "marcar préstamos vencidos / expirar reservas".

---

## 3. Ensamblado de Express — `configs/app.js`

Exporta `export default app` (la instancia ya configurada; **no** llama a `listen` — eso lo hace `index.js`).

### 3.1 Orden EXACTO de middlewares globales
1. `helmet()` — cabeceras de seguridad.
2. `cors()` — CORS.
3. `morgan("dev")` — logging.
4. `express.urlencoded({ extended: false, limit: "10mb" })`.
5. `express.json({ limit: "10mb" })`.

Límite de 10 MB en ambos parsers (tolera payloads con imágenes/base64).

### 3.2 Docs y health
6. `app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))` — Swagger UI.
7. `app.get("/health", ...)` → `200 { ok: true, status: "up" }` (sin auth).

### 3.3 Montaje de routers (todos bajo un prefijo común)
Un router se monta en la **raíz del prefijo** y sus paths internos llevan su propio segmento; el resto se montan en un **sub-path** propio:

```
app.use("<PREFIX>",                 mainRoutes)      // paths internos: /entidad/create, /entidad/get...
app.use("<PREFIX>/favorites",       favoriteRoutes)
app.use("<PREFIX>/transactions",    transactionRoutes)
app.use("<PREFIX>/services",        serviceRoutes)
app.use("<PREFIX>/promotions",      promotionRoutes)
app.use("<PREFIX>/currencies",      currencyRoutes)
app.use("<PREFIX>/chatbot",         chatbotRoutes)
```

Donde `<PREFIX>` en el original es `/gestionBancaria/api/v1`.

### 3.4 Manejadores de error (SIEMPRE al final, tras los routers)
8. **404** (middleware sin `next`): `res.status(404).json({ success: false, message: "Endpoint not found" })`.
9. **Error handler global** (firma de 4 args `(err, _req, res, _next)` — obligatoria para que Express lo reconozca): calcula `status = err.status || err.statusCode || 500`, `message = err.message || "Error interno del servidor"`, loguea y responde `{ success: false, message }`.

**Orden canónico completo:** seguridad → CORS → logging → parsers → docs/health → routers → 404 → errorHandler.

> **⚠ Corregir al replicar:** en el original `helmet()` y `cors()` se llaman **sin opciones**, y los objetos `corsOptions` / `helmetConfiguration` existen pero **no se importan**. En la réplica, cablearlos: `app.use(helmet(helmetConfiguration))` y `app.use(cors(corsOptions))`.

→ **Biblioteca:** cambiar el prefijo a algo como `/gestionBiblioteca/api/v1` y montar los routers de las nuevas features.

---

## 4. Conexión a BD — `configs/db.js`

Exporta `export const dbConnection` (async). El **graceful shutdown se auto-registra** al importar el módulo.

**Contrato de `dbConnection()`:**
- Registra listeners de eventos de mongoose (`error` → además `disconnect()`; `connecting`, `connected`, `open`, `reconnected`, `disconnected` → log).
- `mongoUri = process.env.URI_MONGO || 'mongodb://localhost:27017/<dbLocalFallback>'` (con `console.warn` si usa el fallback).
- `mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 })`.
- Todo en try/catch que solo loguea (no re-lanza).

**Graceful shutdown (nivel módulo):** `gracefulShutdown(signal)` cierra la conexión y `process.exit(0/1)`. Registrado para **`SIGINT`, `SIGTERM`, `SIGUSR2`** (esta última es la de nodemon al reiniciar → cierre limpio en dev).

> **Nota sobre `URI_MONGO`:** usar la forma **sin `+srv`** si la red bloquea consultas DNS SRV (redes universitarias). Equivale a `mongodb+srv://user:pass@cluster.../db`.

---

## 5. Config de seguridad HTTP (objetos, hoy desconectados)

### `configs/cors-configuration.js` → `corsOptions`
```
origin: true,                 // refleja el origin (permite todos)
credentials: true,
methods: ['GET','POST','PUT','DELETE','OPTIONS'],
allowedHeaders: ['Content-Type','Authorization','x-token'],
```
Nota: acepta el JWT tanto en `Authorization: Bearer` como en el header **`x-token`**.

### `configs/helmet-configuration.js` → `helmetConfiguration`
CSP con `useDefaults: true` + directivas: `defaultSrc 'self'`; `scriptSrc/styleSrc 'self' 'unsafe-inline'`; `imgSrc 'self' data: blob:`; `objectSrc 'none'`; `frameAncestors 'none'`. Además `hsts: false`, `frameguard: deny`, `noSniff: true`, `hidePoweredBy: true`, `crossOriginResourcePolicy: cross-origin`, `crossOriginEmbedderPolicy: false`. Las relajaciones (`unsafe-inline`, cross-origin) existen para que **Swagger UI** cargue.

---

## 6. Documentación — `configs/swagger.js`

Exporta el spec compilado (`swaggerJSDoc(options)`), listo para `swaggerUi.setup`. Enfoque **híbrido**:
- `swaggerDefinition` con `openapi: "3.0.3"`, `info` (título, versión, descripción con reglas de negocio globales), `servers` (URL con el prefijo), `tags` (uno por feature), `paths` (definición inline detallada), `components.securitySchemes.bearerAuth` (http/bearer/JWT), `components.schemas` (entidades + requests + `ErrorResponse` + `Pagination`), y `security: [{ bearerAuth: [] }]` **global**.
- `options.apis: ["./src/**/*.routes.js"]` → además fusiona comentarios JSDoc `@swagger` de los routers.

---

## 7. Variables de entorno — `.env.example`

| Variable | Sirve para |
|---|---|
| `NODE_ENV` | Entorno (`development`/`production`). |
| `PORT` | Puerto del servidor (fallback `3000`). |
| `URI_MONGO` | URI de conexión Mongo. |
| `JWT_SECRET` | Secreto para **validar** JWT (debe coincidir con el del AuthService que los emite). |
| `JWT_ISSUER` | Issuer esperado. |
| `JWT_AUDIENCE` | Audience esperado. |
| `AUTH_SERVICE_URL` | Base URL del AuthService externo (default `http://localhost:4000/api/v1`). Usado por los gates de elegibilidad para consultar perfil. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` / `CLOUDINARY_FOLDER` | Subida de imágenes a Cloudinary. |
| (LLM) `GEMINI_API_KEY` **o** `GCP_PROJECT_ID` + `GCP_LOCATION` | Chatbot (según se use la API pública de Gemini o Vertex AI con ADC). |

> **Seguridad:** en el repo original el archivo de env real contiene **credenciales reales** (Mongo, Cloudinary, LLM). En la réplica: `.env` en `.gitignore`, solo commitear `.env.example` con placeholders, y **rotar** cualquier secreto expuesto.

---

## 8. Middlewares transversales (`middlewares/`)

**Convención de fallo:** un middleware que rechaza hace `return res.status(...).json({ success:false, message, ... })` (respuesta directa, **no** `next(err)`). Uno que pasa el testigo llama `next()`. Respuesta uniforme en toda la app: `{ success: boolean, message, ... }`; validación añade `errors: [...]`.

### 8.1 Autenticación vs Autorización (distinción clave)

| Middleware | Tipo | Fuente del dato | Qué inyecta en `req` |
|---|---|---|---|
| `validateJWT` | **Autenticación** (¿quién hace la petición?) | header `x-token` / `authorization` (quita `Bearer `) / query `?token` | `req.userId = decoded.sub`, `req.adminId = decoded.sub` (alias legacy), `req.userRole = decoded.role` |
| `isAdmin` | **Autorización** por rol | lee `req.userRole` | nada |
| `validateClientRole` | **Autorización** por rol cliente | lee `req.userRole` | nada |
| `validateUserFromBody` | **Autenticación de 2º sujeto** | `req.body.tokenUsuario` | `req.targetUserId = decoded.sub` |

**`validateJWT`** (`validate-JWT.js`): verifica con `jwt.verify(token, JWT_SECRET, { issuer, audience })`. Sin token → `401 {message:'No hay token en la petición'}`. Inválido/expirado → `401` (distingue `TokenExpiredError` por `error.name`). **Es el que puebla `req.userId`/`req.userRole` que todo controller asume.**

**`isAdmin`** (mismo archivo): corre **después** de `validateJWT`. Si `req.userRole !== 'ADMIN_ROLE'` → `403 {message:'No tienes permisos para esta acción'}`.

**`validateClientRole`** (`validate-ClientRole.js`): acepta un `Set(['USER_ROLE','CLIENT_ROLE','CLIENTE'])` (alias del rol cliente). Si no está → `403 {message:'Solo clientes pueden realizar esta accion.'}`.

**`validateUserFromBody`** (`validate-UserJWT.js`): el token viene en el **body** (`tokenUsuario`) y NO identifica a quien pide sino a un **usuario-objetivo** (patrón: un operador presenta el token de otro usuario para operar en su nombre). Inyecta `req.targetUserId`. Sin token → `400`; inválido → `401`.

→ **Biblioteca:** `validateJWT` = "¿hay un usuario logueado?" (`req.userId`, `req.userRole`); `isAdmin` → `LIBRARIAN_ROLE`/`ADMIN_ROLE`; `validateClientRole` → `MEMBER_ROLE`; `validateUserFromBody` → cuando un bibliotecario procesa un préstamo presentando el token/carnet del socio (`req.targetUserId`).

### 8.2 Validadores declarativos (`<entidad>-validators.js` + `allowed-fields.js`)

**Patrón:** cada export es un **array de cadenas de `express-validator`** (`body()`/`param()`/`query()`) terminado en un handler `handleValidationErrors`. Se monta en la ruta: `router.post('/', validateCreateX, controller)`.

`handleValidationErrors(req,res,next)`: si `validationResult(req)` tiene errores, responde `400 { success:false, message:'Errores de validacion', errors: [{ field, message, value }] }`; si no, `next()`.

Elementos reutilizables del patrón:
- **Reglas-factory parametrizadas por `isRequired`** (ej. `nameRules(isRequired)`, `priceRules(isRequired)`) para compartir lógica entre "crear" (todo obligatorio) y "actualizar" (todo opcional).
- **Validación condicional**: `.if(body('campo').equals('X'))` o `.if(body('obj').isObject())` para validar sub-campos solo cuando aplica (ej. "terms obligatorio solo si type=SERVICE").
- **Custom validators**: rango de fechas (`validTo > validFrom`), anti-inyección (rechazar `<>{}[]` en nombres), coherencia de descuentos (PERCENT ≤100, AMOUNT ≤ price).
- **Whitelist anti mass-assignment** (`ensureAllowedFields`): compara `Object.keys(req.body)` contra un array en `allowed-fields.js`; rechaza campos no permitidos y exige ≥1 campo. Se antepone en los validadores de "update".
- **Validador de query** (`validateXQuery`): valida paginación (`page` int ≥1, `limit` int 1–100), filtros por enum, rangos de precio, `sortBy` contra un set de valores permitidos.
- **Validador de id**: `param('id').isMongoId()`.

→ **Biblioteca:** `validateCreateBook` (título, ISBN con regex, autor, categoría enum, copias int), `validateBookQuery`, whitelists en `allowed-fields.js` (`allowedBookFields`, `allowedLoanFields`, ...).

### 8.3 Pipeline de multipart/form-data (uploads)

Tres middlewares que trabajan juntos. **Orden en la ruta:** `uploadFieldImage.single('image')` → `parseJsonFields([...])` → validadores.

**`file-uploader.js`** — multer + Cloudinary (subida directa a la nube, sin disco):
- Configura `cloudinary.config(...)` desde env. `MIMETYPES` = jpeg/png/jpg/webp/avif/jfif; `MAX_FILE_SIZE` = 10 MB.
- Factory `createCloudinaryUploader(folder)` → `multer({ storage: new CloudinaryStorage(...), fileFilter, limits })`. El `storage.params(req,file)` genera `public_id` a partir del nombre saneado + uuid; define transformaciones de tamaño.
- Exporta `uploadFieldImage` (ya construido con `process.env.CLOUDINARY_FOLDER`). En la ruta: `uploadFieldImage.single('campo')`; multer deja el archivo en **`req.file`** (con `req.file.path` = URL de Cloudinary) y los campos de texto en `req.body`.
- **⚠ Bugs a corregir en la réplica:** `uuidv4().substring(0,0)` (devuelve string vacío; debe ser `(0,8)`), y typos `with`→`width`, `heigth`→`height` en la transformación.

**`parseFormData.js`** — `multer().none()`: parsea `multipart/form-data` **sin archivos** (solo campos de texto → `req.body`). Para formularios que envían `FormData` sin subir imagen.

**`parse-json-fields.js`** — factory `parseJsonFields(fields = [])`: en multipart todo llega como string; este middleware **des-serializa** los campos que deberían ser objetos/arrays (JSON stringificado) **antes** de los validadores, para que `isArray()`/`isObject()` funcionen. Si el `JSON.parse` falla, deja el string original (para que el validador reporte el error). Nunca produce error; siempre `next()`.

→ **Biblioteca:** `uploadFieldImage.single('cover')` para portadas; `parseJsonFields(['tags','authors','metadata'])`.

### 8.4 Gates de negocio (`check<Entidad>Eligibility.js`)

**Patrón:** middleware que valida **reglas de negocio** (no formato) antes de servir un recurso, y **enriquece `req`** con la entidad cargada (`req.<entidad>`). Estructura común:
1. **Bypass admin:** si `req.userRole === 'ADMIN_ROLE'` → `next()` inmediato.
2. Carga la entidad por `req.params.id`; si no existe → `404`.
3. Cadena de checks, **cada uno con su `403` específico**: estado activo, ventana de fechas (`validFrom`/`validTo`), rol en `targetRoles`, límites de uso (global y por usuario, este último leyendo el ledger de uso), presupuesto, segmentación, requisitos (email verificado, saldo mínimo).
4. Consultas al **AuthService externo** (`POST {AUTH_SERVICE_URL}/auth/profile/by-id`) para datos de perfil (fecha de registro, email verificado). Si el AuthService cae → `503` (cuando el dato es imprescindible) o **degradación grácil** (`next()`, permitir) cuando el check es secundario.
5. Éxito: `req.<entidad> = doc` y `next()`. Error inesperado → `500`.

**Patrón de resiliencia (graceful degradation):** los fallos de servicios externos/BD en checks no críticos se capturan y **permiten continuar**, para no bloquear al usuario por un fallo de infraestructura.

→ **Biblioteca:** `checkLoanEligibility` (¿hay copias disponibles?, ¿el socio no excede su límite de préstamos?, ¿no tiene multas pendientes?), `checkReservationEligibility`, etc.

### 8.5 Middlewares de reglas puntuales

Ejemplos del original (adaptar al dominio):
- **`transaction.middleware.js`** (`validateTransaction`): valida campos + reglas de negocio combinadas (existencia de cuentas, **propiedad** — `origin.userId === req.userId` →`403`—, saldo suficiente, y "cierto tipo solo admin"). → Biblioteca: "¿el socio es dueño de la reserva?", "¿la copia está disponible?", "solo bibliotecario puede registrar X".
- **`requireDescriptionForTransaction.js`**: exige un campo (`descripcion`) no vacío para ciertos tipos de operación. → Biblioteca: exigir "motivo" al condonar una multa.
- **`currencyConversion.js`**: transforma `req.body` añadiendo montos convertidos entre monedas antes de persistir, usando el helper de divisas. → Biblioteca: normalmente no aplica (salvo multas multi-divisa).

---

## 9. Helpers (`helpers/`)

### 9.1 Lógica de dominio sin modelo (`<dominio>-logic.js`)
Datos **volátiles** que NO se persisten como colección (ej. tasas de cambio) viven en un helper con **cascada de fuentes externas + fallback local**:
- Tabla local de respaldo (constantes) para continuidad si las APIs fallan.
- Función que intenta N APIs externas en orden (try/catch que degrada a la siguiente) y, si todas fallan, usa el cálculo local.
- Funciones puras de transformación (`convert`, `getAll…`, `getHistorical…`) que otros módulos importan.

→ **Biblioteca:** si hay algo análogo (ej. consulta de metadatos de libro por ISBN a una API externa como OpenLibrary), va aquí como helper, **sin modelo Mongoose**.

### 9.2 Cron de transiciones de estado (`<estado>-status-cron.js`)
**Cron casero con `setInterval`** (no `node-cron`), típicamente cada 15 min:
- `runStatusMaintenanceJob()` (async, envuelto en try/catch): varios `updateMany` que cambian estados según fechas (ej. `SCHEDULED` con `validFrom<=now` → `ACTIVE`; `ACTIVE` con `validTo<now` → `EXPIRED`). Loguea `modifiedCount`.
- `startXCron()` (export): **ejecuta el job inmediatamente al arrancar** y luego lo repite con `setInterval`. Se llama una vez en `index.js` tras conectar la BD.

→ **Biblioteca:** marcar préstamos vencidos (`ACTIVO` con `dueDate<now` → `VENCIDO`/`OVERDUE`), expirar reservas no recogidas, liberar holds caducados.

---

## 10. Anatomía de un módulo-feature (`src/<feature>/`)

Cada feature es una carpeta con estos archivos. Aquí están los **contratos** de cada uno.

### 10.1 Modelo — `<feature>.model.js`
Patrón Mongoose estándar:
- `new Schema({...}, { timestamps: true, versionKey: false })` (agrega `createdAt`/`updatedAt`, quita `__v`).
- **Enums con mensaje:** `{ type: String, enum: { values: [...], message: '...' } }`.
- **Validaciones:** `required: [true, 'msg']`, `min`, `maxlength`, `trim`.
- **Setters de normalización** para números: `set: v => Number(parseFloat(v).toFixed(2))` (redondea a 2 decimales).
- **Relaciones por valor de negocio**: guardar `userId` (string, el `sub` del JWT) o un identificador de negocio (número de cuenta), **no** `ObjectId ref` — salvo el **ledger de uso** (ver 10.6), que sí usa `ref`.
- **Índices explícitos**: simples, compuestos, y `unique` donde aplique (ej. `{ userId:1, cuenta:1 }` único).
- **Autogeneración de identificadores únicos** vía `pre('validate')` async: genera un número aleatorio y verifica unicidad en bucle con `this.constructor.exists({ campo })`.
- **Ocultamiento de `_id`**: dos variantes en el código base — (a) `toJSON: { virtuals:true, transform: (doc,ret)=>{ ret.id=ret._id; delete ret._id; return ret; } }` (expone `id`), o (b) borrar `_id` manualmente en el controller (`delete obj._id`). Elegir **una** y ser consistente.
- **Subdocumentos embebidos**: para estructuras anidadas sin identidad propia, `new Schema({...}, { _id:false })` como tipo de un campo (ej. un `discount` embebido con sus propios campos/validaciones).
- Campos comunes de auditoría: `createdBy` (requerido, `req.userId`), `updatedBy` (default `null`).
- Campos internos/contadores denormalizados: `currentUses`, `budgetUsed`, etc. (default `0`), **nunca aceptados desde el body**.

### 10.2 Modelo de solicitud — `<feature>-request.model.js` (workflow de aprobación admin)
**Patrón "request":** el cliente NO crea el recurso final directamente; crea una **solicitud** que un admin aprueba/rechaza.
- Campos: solo los que el **cliente puede elegir** + máquina de estados + auditoría.
- `status`: `enum ['PENDING','APPROVED','DENIED']`, default `'PENDING'`.
- Auditoría: `reviewedBy` (admin, default null), `reviewedAt` (Date, null), `reviewComment` (string ≤250, null).
- **Flujo:**
  1. Cliente crea la solicitud (`status: PENDING`) — solo sus campos elegibles.
  2. Admin **lista** las pendientes (filtro por `status`, incluye opción `ALL`).
  3. Admin **aprueba** → crea el recurso real con **valores controlados por el sistema** (ej. `saldo:0`, `estado:true`), y marca la solicitud `APPROVED` con `reviewedBy`/`reviewedAt`.
  4. Admin **deniega** → no crea nada; marca `DENIED` con `reviewComment` (motivo).
  5. **Transiciones guardadas:** aprobar/denegar solo se permite si `status === 'PENDING'`; si no → `409 Conflict`.

→ **Biblioteca:** `loan-request.model.js` / `reservation-request.model.js`: el socio solicita un préstamo/reserva; el bibliotecario aprueba (crea el `Loan` real con fechas controladas por el sistema) o rechaza con motivo.

### 10.3 Controller — `<feature>.controller.js`
- Funciones **nombradas** `export const nombre = async (req, res) => {...}`.
- **Respuesta uniforme:** `{ success, message?, data?, error?, pagination? }`. En `catch`, `error: error.message`.
- **Códigos HTTP:** `201` crear · `200` ok/listar/actualizar · `400` validación/negocio · `403` rol/propiedad · `404` no encontrado · `405` operación no permitida · `409` conflicto de estado (duplicado `code 11000`, transición inválida) · `500` interno.
- **Paginación manual:** leer `page`/`limit` (normalizar con `Math.max(...,1)` y clamp `limit` a 1–100), `find(filter).skip((page-1)*limit).limit(limit).sort({createdAt:-1})` + `countDocuments(filter)`; responder `pagination: { currentPage, totalPages, totalRecords, limit }`.
- **Filtrado por rol / visibilidad:** admin ve todo; no-admin ve solo lo suyo (`filter.userId = req.userId`) y solo recursos `ACTIVE`/`active`. Ocultar campos sensibles a no-admin (`sanitizeForNonAdmin` borra `internalNote`, saldos ajenos, etc.).
- **Protección de campos internos:** `stripInternalWriteFields(body)` borra contadores/auditoría del body antes de crear/actualizar; `createdBy`/`updatedBy` se setean desde `req.userId`.
- **Soft delete:** DELETE normalmente **no borra**; cambia `status` a terminal (`ARCHIVED`/`CANCELLED`) + `active=false`. (Excepción: entidades tipo "favoritos" hacen **hard delete** con `deleteOne({_id, userId})` scoped por usuario.)
- **Validación de referencias cruzadas:** si un campo lista IDs de otra entidad, verificar que existan (`findById`) y responder `400` con la lista de inexistentes.
- **Máquina de estados en acciones dedicadas:** endpoints tipo `toggle`/`approve`/`deny` que validan la transición permitida antes de aplicarla.

### 10.4 Rutas — `<feature>.routes.js`
- `Router()` de Express; cada ruta encadena middlewares **en orden**:
  `validateJWT → [parse/upload] → [rol: isAdmin/validateClientRole] → [validadores] → [gate/enriquecimiento] → controller`.
- Ejemplos de orden real:
  - **Crear con imagen (admin):** `validateJWT, isAdmin, uploadFieldImage.single('image'), parseJsonFields([...]), validateCreateX` → `createX`.
  - **Listar:** `validateJWT, validateXQuery` → `listX`.
  - **Obtener por id:** `validateJWT, validateXId, checkXEligibility` → `getXById`.
  - **Actualizar (admin):** `validateJWT, isAdmin, validateXId, uploadFieldImage.single('image'), parseJsonFields([...]), validateUpdateX` → `updateX`.
  - **Borrar (admin):** `validateJWT, isAdmin, validateXId` → `deleteX` (soft delete).
- Algunas autorizaciones se hacen en la **ruta** (`isAdmin`) y otras **dentro del controller** (comprobando `req.userRole`) — ambos estilos coexisten; preferir el middleware en la ruta por claridad.
- El router "principal" incluye su propio segmento en los paths (`/entidad/create`, `/entidad/get`) porque se monta en la raíz del prefijo.

### 10.5 Módulo de solo-lectura sin modelo (ej. `currencies`)
Feature con `controller` + `routes` pero **sin modelo**: es un thin wrapper sobre un helper que consulta datos externos. Puede ser **público** (sin `validateJWT`) cuando el dato no es sensible. → Biblioteca: un endpoint de "búsqueda de metadatos por ISBN" contra una API externa.

### 10.6 Patrón "definición + ledger de uso" (ej. `promotions` + `promotion-usage`)
Dos modelos que trabajan juntos:
- **Definición** (`<X>.model.js`): la entidad mutable con reglas/límites/ventana de validez y **contadores denormalizados** (`currentUses`, `budgetUsed`) para chequeos O(1).
- **Ledger de uso** (`<X>-usage.model.js`): filas de **evento inmutables** que **sí** usan `ref` (`{ type: ObjectId, ref: '<X>' }`) + `userId` + `status: ['APPLIED','REVERSED']` (default `APPLIED`) + `usedAt` + detalles (`Mixed`). Permite: contar usos totales y usuarios únicos (`countDocuments`, `distinct('userId')`), enforcement de `maxUsesPerUser`, reglas de exclusividad, y **reversión lógica** (marcar `REVERSED`, sin borrar).
- La denormalización (contadores en la definición) y el ledger (verdad auditable) coexisten.

→ **Biblioteca:** `Book`/`BookCopy` (definición, con `copiasDisponibles` denormalizado) + `Loan` (ledger: `bookId` ref, `userId`, `loanDate`, `dueDate`, `status: ACTIVO|DEVUELTO|VENCIDO`). Contadores rápidos en el libro + historial completo en los préstamos.

### 10.7 Módulo con servicio externo (ej. `chatbot`) — capa `service` separada
Cuando un módulo integra un servicio externo (LLM), se añade una capa `<feature>.service.js` que **aísla toda la dependencia externa**; el controller nunca toca el SDK.
- **`<feature>.model.js`**: documento con `userId` indexado + array **embebido** de mensajes (`role` enum, `content`, timestamps), `title` con default. Subdoc de mensaje con `_id: false`.
- **`<feature>.service.js`**: instancia el SDK del LLM **dentro** de la función (para asegurar que dotenv ya cargó env), mapea el historial al formato del proveedor, inyecta `systemInstruction` + `tools`, ejecuta un **bucle de function-calling** donde los "resolvers" (`toolFunctions[name]`) consultan el dominio real **scoping por `userId`** y devuelven datos al modelo hasta que no haya más llamadas; expone **una sola función** `generateResponse(history, userId)` que retorna texto. Toda dependencia del proveedor vive aquí.
- **`<feature>.controller.js`**: valida input, persiste el mensaje del usuario, llama al service, persiste la respuesta, responde `{ success, ... }`; maneja errores de config del proveedor de forma específica. No conoce el SDK.
- **`<feature>.routes.js`**: `router.use(validateJWT)` global + validaciones `express-validator` por endpoint (listar, obtener por id, enviar mensaje).
- **`system-prompt.js`**: string exportado con identidad del asistente, **límites de dominio** (rechazar temas ajenos), reglas de seguridad (solo datos del **usuario autenticado**), restricción a **solo-lectura** (para acciones de escritura, redirigir a la ruta/pantalla correspondiente) y aviso de las tools disponibles. Refuerza en lenguaje natural lo que el código ya garantiza técnicamente.

→ **Biblioteca:** asistente que consulta (solo lectura) libros, préstamos, reservas y multas **del socio autenticado** vía function-calling; para acciones (reservar, renovar) redirige a la pantalla correspondiente.

---

## 11. Seeds y colección Postman
- `seeds/seed_*.json`: datos semilla por entidad (uno por feature).
- Contrato de la API documentado además como **colección Postman** en la raíz del backend y vía **Swagger UI** en `/api-docs`.

---

## 12. Docker
- **Dockerfile:** base `node:22-alpine`; `corepack enable` (pnpm); copiar `package.json`/`pnpm-lock.yaml` primero (cache de capas); `pnpm install`; copiar el resto; `EXPOSE <PORT>`; `CMD ["pnpm","start"]`.
- **.dockerignore:** excluye `node_modules`, logs, `.env`, `.git`, `Dockerfile`, `.dockerignore`.
- *Mejoras sugeridas para prod:* `--frozen-lockfile`, `pnpm install --prod`, usuario no-root, multi-stage.

---

## 13. Checklist de patrones a replicar (resumen)

1. **ESM puro** + top-level await en el entrypoint.
2. **Separación entrypoint/app:** `configs/app.js` arma y exporta la app; `index.js` conecta BD, arranca cron y hace `listen`.
3. **Estructura por feature-folder:** `src/<feature>/` con `model` + `controller` + `routes` (+ `-request.model`, `service`, `system-prompt` opcionales); montar router en `configs/app.js` bajo prefijo común.
4. **Orden de middlewares fijo:** helmet → cors → morgan → parsers → docs/health → routers → 404 → errorHandler.
5. **Respuesta uniforme** `{ success, message, data?, error?, errors?, pagination? }`.
6. **Auth externa por JWT:** `validateJWT` inyecta `req.userId`/`req.userRole`; `isAdmin`/`validateClientRole` autorizan; token en `Authorization: Bearer` o `x-token`.
7. **Validación con express-validator** como arrays terminados en `handleValidationErrors`, con reglas-factory (crear/actualizar), whitelist anti mass-assignment y validador de query para paginación/filtros.
8. **Pipeline multipart:** `uploadFieldImage.single(...)` (multer+Cloudinary) → `parseJsonFields([...])` → validadores.
9. **Gates de negocio** que enriquecen `req` con la entidad, con bypass admin y graceful degradation ante fallos externos.
10. **Modelos Mongoose:** `{ timestamps, versionKey:false }`, enums con mensaje, setters de redondeo, índices explícitos, relaciones por valor de negocio, autogeneración de ids con `pre('validate')`, ocultamiento de `_id`, subdocumentos embebidos con `_id:false`.
11. **Patrón request** (solicitud PENDING/APPROVED/DENIED + auditoría) para flujos con aprobación admin.
12. **Soft delete** (status terminal + `active:false`), salvo hard delete scoped por usuario en entidades tipo favoritos.
13. **Definición + ledger de uso** (contadores denormalizados + colección de eventos inmutables con `ref` y `status`).
14. **Máquina de estados + cron** (`setInterval`) para transiciones por fecha con `updateMany`.
15. **Datos volátiles sin modelo** → helper con cascada de APIs y fallback local.
16. **Módulo con servicio externo** → capa `service.js` que aísla el SDK, con function-calling scoping por usuario y `system-prompt.js`.
17. **Bugs conocidos a corregir en la réplica:** cablear `corsOptions`/`helmetConfiguration`; `uuidv4().substring(0,8)` (no `(0,0)`) y typos `width`/`height` en `file-uploader.js`; no filtrar el objeto `error` de `node:console` en respuestas; índices que apuntan a un campo inexistente (`fechaTransaccion` cuando el schema usa `createdAt`).

---

## 14. Mapa de traducción dominio bancario → biblioteca (orientativo)

| Banco (original) | Biblioteca (réplica) |
|---|---|
| `accounts` (recurso principal del usuario) | `members`/`readers` o `bookCopies` |
| `account-request` (workflow admin) | `loan-request` / `reservation-request` |
| `transactions` (movimientos con reglas/límites) | `loans` (préstamos con límites por socio/día, ventana de devolución, estados) |
| `favorites` (CRUD simple scoped por usuario) | `favorites`/`wishlist` de libros del socio |
| `services` (catálogo admin + elegibilidad) | `services` (salas, préstamo digital) o `categories` |
| `promotions` + `promotion-usage` (definición + ledger) | `campaigns`/`books` + `loans` (definición + registro de uso) |
| `currencies` (datos externos sin modelo) | metadatos por ISBN vía API externa (sin modelo) |
| `chatbot` (LLM + tools solo-lectura) | asistente de biblioteca (consulta libros/préstamos/multas del socio) |
| cron de estado de promociones | cron de préstamos vencidos / reservas expiradas |

> Recordar: el AuthService es un **microservicio aparte** que emite los JWT; este backend solo los valida y consulta perfiles vía `AUTH_SERVICE_URL`. En la réplica de biblioteca ya existe `AuthService-GestionBiblioteca` como su equivalente.