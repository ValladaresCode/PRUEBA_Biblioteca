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
Regla de modificación
Antes de modificar un contrato:
Detener la tarea afectada.
Informar al Scrum Master.
Revisar qué otros componentes dependen del contrato.
Actualizar este documento.
Informar a los demás integrantes.