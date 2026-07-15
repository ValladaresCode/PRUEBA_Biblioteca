# 6to. Informática  
**Desarrollo ágil de aplicación web**  
**Variante 1 – Sistema de gestión de biblioteca**

## Duración y Modalidad
- **Duración**: 4 horas 30 minutos  
- **Modalidad**: Equipos de trabajo previamente distribuidos.

---

## Metodología de trabajo

El proyecto deberá desarrollarse aplicando la metodología **Scrum**, organizando el trabajo en **tres iteraciones (Sprints)**, donde cada una represente un incremento funcional del sistema.

Cada Sprint tendrá una duración de **90 minutos**:

- **Sprint 1** – 90 minutos
- **Sprint 2** – 90 minutos
- **Sprint 3** – 90 minutos

**Al finalizar cada Sprint el equipo deberá**:

- Revisar el avance obtenido.
- Integrar los cambios mediante **Pull Request**.
- Resolver conflictos de integración cuando existan.
- Mantener una versión funcional del proyecto en la rama `main/master`.

El proyecto deberá permanecer **funcional** al finalizar cada Sprint, demostrando entregas incrementales propias de un proceso ágil.

---

## Objetivo

Desarrollar una aplicación web funcional utilizando una **arquitectura distribuida** basada en múltiples servicios, aplicando buenas prácticas de desarrollo colaborativo, control de versiones y entregas incrementales mediante Scrum.

---

## Tecnologías mínimas

El proyecto deberá utilizar como mínimo:

- **React**
- **Node.js**
- **Express**
- **MongoDB**
- **Git**
- **GitHub**

Adicionalmente, cada equipo podrá utilizar cualquier tecnología que considere conveniente, por ejemplo:

- Tailwind CSS
- Material UI
- Docker
- Zustand
- Redux
- JWT
- Axios
- React Router
- Entre otras.

---

## Arquitectura obligatoria

El proyecto deberá estar compuesto, como mínimo, por los siguientes componentes:

- **Frontend** desarrollado en React.
- **Servicio de Autenticación** (API de Auth).
- **Servicio A** (API de Gestión de Biblioteca).
- **Servicio B** (API de Estadísticas y Recomendaciones).
- **Base de datos MongoDB**.

Cada servicio deberá ejecutarse de forma independiente utilizando un **puerto diferente**.

**Especificaciones**:
- El Servicio de Autenticación será responsable exclusivamente del proceso de autenticación y emisión de tokens.
- El Servicio B deberá implementar lógica propia y **no podrá limitarse únicamente a reenviar solicitudes** hacia el Servicio A.
- Cuando sea necesario obtener información administrada por el Servicio A, el Servicio B podrá consumir sus endpoints mediante HTTP.

---

## Organización del equipo

Cada integrante deberá asumir un rol durante el desarrollo del proyecto.

**Roles sugeridos**:

- **Scrum Master** (Servicio Auth)
- **Backend Developer** (Servicio A)
- **Backend Developer** (Servicio B)
- **Frontend Developer**

La asignación de roles no limita la participación del resto del equipo. **Todos los integrantes deberán desarrollar código** durante la actividad.

---

## Trabajo colaborativo

El desarrollo deberá evidenciar el trabajo colaborativo del equipo durante toda la actividad.

**Obligatorio**:

- Cada integrante trabajará sobre su propia rama.
- No está permitido desarrollar directamente sobre la rama `main`.
- Todos los integrantes deberán realizar commits propios.
- Todos los integrantes deberán participar en el desarrollo del proyecto.
- Cada Sprint deberá finalizar con la creación y aprobación de al menos un **Pull Request** antes de integrar los cambios.
- El historial del repositorio deberá evidenciar claramente la participación de todos los integrantes.

---

## Repositorio del proyecto

El proyecto deberá entregarse mediante un **único repositorio Git (Monorepo)**. No se aceptarán repositorios separados para cada servicio.

**Estructura mínima**:

```bash
biblioteca-app/
├── frontend/
├── service-auth/
├── service-library/
├── service-statistics/
├── README.md
└── .gitignore

Cada subproyecto deberá contar con:

Su propio package.json
Sus dependencias
Su estructura de carpetas
Configuración independiente


Uso de Inteligencia Artificial
Está permitido utilizar herramientas de IA como apoyo durante el desarrollo.
Sin embargo:

Cada integrante deberá comprender completamente el código que desarrolla.
Durante la revisión podrán realizarse preguntas individuales.
No se permitirá justificar una implementación indicando únicamente que fue generada por IA.


Descripción del proyecto
Una biblioteca desea digitalizar la administración de su catálogo de libros y ofrecer información útil sobre el uso de sus recursos.
El sistema deberá permitir gestionar libros, préstamos y devoluciones, además de generar estadísticas y recomendaciones para facilitar la administración de la biblioteca.

Servicio de Autenticación
Autenticación
Responsable de la autenticación de los usuarios del sistema.
Funcionalidades mínimas:

Registro de usuarios
Inicio de sesión
Emisión de JSON Web Token (JWT)
Validación de credenciales

Modelo Usuario (mínimo):

nombre
correo electrónico
contraseña (almacenada cifrada con argon2 o equivalente)

Endpoints mínimos sugeridos:

POST /auth/register
POST /auth/login

El endpoint de login deberá retornar un JWT válido para consumir los servicios protegidos.

Servicio A – Gestión de Biblioteca
Responsable de la administración del catálogo y de los préstamos.
Funcionalidades mínimas:

Registrar, editar y eliminar libros
Consultar libros
Buscar libros por título, autor o categoría
Registrar préstamos
Registrar devoluciones
Consultar disponibilidad

Modelo Libro (mínimo):

título
autor
categoría
año
disponible

Endpoints mínimos sugeridos:

GET /books
GET /books/:id
POST /books
PUT /books/:id
DELETE /books/:id
POST /loans
POST /returns

Los endpoints del Servicio A deberán requerir un JWT válido (excepto los que el equipo decida mantener públicos).

Servicio B – Estadísticas y Recomendaciones
Este servicio deberá implementar lógica independiente para generar información útil.
Podrá consumir información del Servicio A mediante HTTP cuando sea necesario.
Funcionalidades mínimas:

Mostrar libros más prestados
Mostrar cantidad de préstamos por categoría
Mostrar últimos libros agregados
Recomendar libros disponibles según una categoría
Generar un resumen general de la biblioteca

Endpoints mínimos sugeridos:

GET /statistics
GET /statistics/categories
GET /recommendations/:category
GET /summary


Frontend
El frontend deberá consumir ambos servicios y permitir utilizar todas las funcionalidades implementadas.
Mínimo deberá incluir:

Administración completa de libros
Registro de préstamos y devoluciones
Consulta de disponibilidad
Consulta de estadísticas
Consulta de recomendaciones

La interfaz deberá ser funcional, organizada y facilitar la navegación.
El JWT obtenido durante el login deberá enviarse en las solicitudes a los servicios protegidos.

Desarrollo por Sprint
Sprint 1 (90 minutos) – Construcción inicial
Entregables mínimos:

Configuración del Monorepo
Configuración del Frontend y los tres servicios
Configuración de MongoDB
Modelos Usuario y Libro
Servicio de autenticación (registro e inicio de sesión)
Primer endpoint funcional de Servicio A y B
Frontend inicial + primer consumo a Auth
Pull Request e integración a main

Sprint 2 (90 minutos) – Lógica principal
Entregables mínimos:

CRUD completo de libros
Registro de préstamos y devoluciones
Persistencia en MongoDB
Integración Frontend ↔ Servicios
Protección de rutas con JWT
Comunicación entre servicios
Implementación inicial de estadísticas
Pull Request e integración a main

Sprint 3 (90 minutos) – Finalización
Entregables mínimos:

Validaciones en cliente y servidor
Manejo de errores
Mejoras visuales
Estadísticas completas + Recomendaciones
Resumen general
Integración final
Aplicación completamente funcional
Pull Request final a main


Requisitos mínimos obligatorios

Arquitectura distribuida (React + 3 servicios backend independientes)
Único repositorio Monorepo
Servicio de Autenticación independiente con JWT
Contraseñas cifradas con Argon2
Validación de JWT en servicios protegidos
Cada servicio en puerto diferente
Persistencia con MongoDB
Mínimo de endpoints: 2 en Auth, 5 en Servicio A, 3 en Servicio B
Operaciones CRUD
Validaciones cliente y servidor
Interfaz funcional
Aplicación de Scrum + Git + ramas + Pull Requests
README con instrucciones de ejecución
Proyecto funcional al final de cada Sprint


Entregables finales
Cada equipo deberá entregar:

Enlace al repositorio Git (Monorepo)
Proyecto completamente funcional
README con instrucciones de ejecución
Evidencia de los Pull Requests de los tres Sprints
Historial de commits que evidencie trabajo colaborativo
Aplicación funcionando al finalizar la evaluación