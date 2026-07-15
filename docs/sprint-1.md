Sprint 1 — Construcción inicial
Duración
90 minutos.
Objetivo del Sprint
Al finalizar el Sprint 1, los cuatro subproyectos deberán arrancar de forma independiente.
Un usuario podrá registrarse e iniciar sesión desde el frontend. El servicio Auth emitirá un JWT válido. Library consultará libros desde MongoDB y Statistics generará un resumen propio consumiendo el endpoint de Library.
Todos los cambios deberán estar integrados en main mediante Pull Requests y el proyecto deberá conservar una versión funcional.
Incremento funcional esperado
Flujo principal
Frontend
→ Registro o login
→ Auth Service
→ Validación de credenciales
→ Emisión de JWT
→ Redirección a /app
Flujo Library
GET /api/v1/books
→ Consulta MongoDB
→ Devuelve lista de libros
Flujo Statistics
GET /api/v1/summary
→ Consulta Library por HTTP
→ Calcula estadísticas
→ Devuelve resumen
Alcance obligatorio
Monorepo
Crear pnpm-workspace.yaml.
Usar pnpm en todos los subproyectos.
Configurar los cuatro proyectos.
Añadir .gitignore.
Añadir .env.example.
Añadir README inicial.
No guardar secretos reales.
### Auth Service

- Configurar PostgreSQL.
- Configurar Sequelize.
- Crear modelo User.
- Registrar usuarios.
- Iniciar sesión.
- Cifrar contraseñas con Argon2.
- Emitir JWT.
- Validar datos con express-validator.
- Añadir /health.
Library Service
Crear modelo Book.
Conectar con MongoDB.
Implementar GET /api/v1/books.
Añadir /health.
Statistics Service
Implementar GET /api/v1/summary.
Consumir Library mediante HTTP.
Calcular lógica propia.
Manejar caída de Library.
Añadir /health.
Frontend
Crear /register.
Crear /login.
Crear /app.
Consumir Auth mediante Axios.
Guardar sesión mediante Zustand.
Mostrar estados de carga y error.
Redirigir después del login.
Definir una base visual inicial.
Git y Scrum
Cada integrante trabaja en su propia rama.
Todos realizan commits propios.
No se desarrolla directamente sobre main.
Cada trabajo entra mediante Pull Request.
Otro integrante revisa cada Pull Request.
main debe funcionar al finalizar el sprint.
Tareas
S1-01 — Fundación del monorepo
Responsable principal: Scrum Master con Fable 5.
Resultado:
Workspace pnpm.
Configuración raíz.
Contratos.
Documentación inicial.
Carpetas de los cuatro proyectos.
S1-02 — Servicio Auth
Responsable principal: Scrum Master con Fable 5.
Resultado:
Registro.
Login.
Argon2.
JWT.
MongoDB.
Validaciones.
S1-03 — Servicio Library
Responsable principal: Backend Developer A con Grok Build.
Resultado:
Modelo Book.
Conexión a MongoDB.
GET /api/v1/books.
S1-04 — Servicio Statistics
Responsable principal: Backend Developer B con Gemini CLI.
Resultado:
Consumo HTTP de Library.
Cálculo del resumen.
GET /api/v1/summary.
S1-05 — Frontend inicial
Responsable principal: Frontend Developer con su agente asignado.
Resultado:
Registro.
Login.
Estado de autenticación.
Pantalla inicial.
Sistema visual básico.
S1-06 — Integración
Responsable: todo el equipo.
Resultado:
Pull Requests.
Resolución de conflictos.
Prueba completa desde main.
Actualización de docs/handoff.md.
Distribución del tiempo
Minutos	Actividad
0–8	Planning, lectura de contratos y creación de ramas
8–55	Implementación paralela
55–65	Primera integración
65–75	Corrección de errores
75–84	Pull Requests y revisión
84–90	Smoke test, Review y Retrospectiva
Fuera del alcance del Sprint 1
No implementar todavía:
CRUD completo de libros.
Préstamos.
Devoluciones.
Protección JWT en Library.
Protección JWT en Statistics.
Estadísticas completas.
Recomendaciones por categoría.
Gemini dentro de la aplicación.
Cloudinary.
Swagger.
Docker.
Refresh tokens.
Recuperación de contraseña.
Definition of Done
El Sprint 1 está terminado únicamente cuando:
pnpm install funciona desde la raíz.
Los cuatro proyectos arrancan.
Auth registra usuarios.
Auth inicia sesión.
El frontend recibe y conserva el JWT.
Library consulta MongoDB.
Statistics calcula el resumen.
Los contratos compartidos se respetan.
No existen secretos en Git.
Todos los integrantes realizaron commits.
Los cambios están integrados en main.
El proyecto se prueba desde main.
El README contiene instrucciones mínimas.
docs/handoff.md refleja el estado real.
Criterio para abrir el Sprint 2
El Sprint 2 se planificará después de la Review del Sprint 1.
Antes de definirlo se revisará:
qué quedó completamente funcional;
qué tareas quedaron incompletas;
qué errores aparecieron;
qué contratos deben conservarse o corregirse;
qué capacidad real mostró el equipo.