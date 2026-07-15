import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'AuthService Gestor Bancario API',
    version: '1.1.0',
    description:
      'Documentación del Microservicio de Autenticación, Registro y Perfiles (PostgreSQL + JWT).\n\n' +
      '**Flujo típico:** `POST /auth/login` devuelve un token JWT que se usa como `Authorization: Bearer <token>` ' +
      'tanto en este servicio como en el Gestor Bancario (puerto 3006).\n\n' +
      '**Rate limiting:** los endpoints de autenticación están limitados a ~5 peticiones/minuto; los demás a ~20/minuto.',
  },
  servers: [
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Servidor AuthService local',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description:
        'Inicio de sesión, verificación de email y recuperación de contraseña',
    },
    {
      name: 'Registration (Admin)',
      description: 'Registro directo y aprobaciones por Administrador',
    },
    {
      name: 'Registration (Public)',
      description:
        'Solicitudes de registro públicas (requieren aprobación de un admin)',
    },
    {
      name: 'Profile',
      description: 'Perfil del usuario y solicitudes de actualización',
    },
    { name: 'Users (Admin)', description: 'Gestión de usuarios y roles' },
  ],
  paths: {
    // =====================================================
    // AUTHENTICATION
    // =====================================================
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Autentica un usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthLoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login exitoso' },
                    token: {
                      type: 'string',
                      description:
                        'JWT para usar como Bearer token en ambos servicios',
                    },
                    userDetails: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'user_premium_1' },
                        name: { type: 'string', example: 'Usuario Premium 1' },
                        profilePicture: { type: 'string', format: 'uri' },
                        role: {
                          type: 'string',
                          enum: ['ADMIN_ROLE', 'EMPLOYEE_ROLE', 'USER_ROLE'],
                          example: 'USER_ROLE',
                        },
                      },
                    },
                    expiresAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          401: { description: 'Credenciales inválidas' },
          423: {
            description: 'Cuenta bloqueada temporalmente por intentos fallidos',
          },
          429: { description: 'Demasiadas peticiones (rate limit)' },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['Authentication'],
        summary: 'Verifica el correo electrónico de la cuenta',
        description:
          'Confirma la dirección de email usando el token enviado por correo.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthTokenRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Email verificado' },
          400: { description: 'Token inválido o expirado' },
        },
      },
      get: {
        tags: ['Authentication'],
        summary: 'Verifica el email vía enlace (token por query string)',
        description:
          'Variante del endpoint anterior para el enlace que llega al correo: `GET /auth/verify-email?token=...`',
        parameters: [
          {
            name: 'token',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Email verificado' },
          400: { description: 'Token no encontrado, inválido o expirado' },
        },
      },
    },
    '/auth/resend-verification': {
      post: {
        tags: ['Authentication'],
        summary: 'Reenvía el email de verificación',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthEmailRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Email de verificación reenviado' },
          404: { description: 'Usuario no encontrado' },
          429: { description: 'Demasiadas peticiones (rate limit)' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Inicia el flujo de recuperación de contraseña',
        description:
          'Envía un email con el token para restablecer la contraseña.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthEmailRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Instrucciones enviadas al email' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Cambia la contraseña utilizando el token de recuperación',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResetPasswordRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Contraseña restablecida' },
          400: { description: 'Token inválido o expirado' },
        },
      },
    },
    // =====================================================
    // REGISTRATION
    // =====================================================
    '/auth/register': {
      post: {
        tags: ['Registration (Admin)'],
        summary: 'Registra un usuario directamente',
        description:
          'Crea la cuenta de inmediato y envía email de verificación. Requiere contraseña de mínimo 8 caracteres y teléfono de 8 dígitos.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/AuthRegisterRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Usuario registrado exitosamente' },
          400: { description: 'Errores de validación' },
          409: { description: 'Email ya existe' },
          429: { description: 'Demasiadas peticiones (rate limit)' },
        },
      },
    },
    '/auth/signup-request': {
      post: {
        tags: ['Registration (Public)'],
        summary: 'Crea una solicitud de registro pública (sujeta a aprobación)',
        description:
          'El usuario NO queda creado: un administrador debe aprobar la solicitud con `POST /auth/signup-requests/{id}/approve`.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/AuthRegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description:
              'Solicitud creada exitosamente, en espera de aprobación',
          },
          400: { description: 'Errores de validación' },
          409: { description: 'Email ya existe o ya hay solicitud pendiente' },
        },
      },
    },
    '/auth/signup-requests': {
      get: {
        tags: ['Registration (Admin)'],
        summary:
          'Listar solicitudes de registro pendientes (Requiere Rol Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de solicitudes pendientes' },
          403: { description: 'No autorizado (Requiere Admin)' },
        },
      },
    },
    '/auth/signup-requests/{id}/approve': {
      post: {
        tags: ['Registration (Admin)'],
        summary: 'Aprobar una solicitud de registro (Requiere Rol Admin)',
        description:
          'Crea el usuario a partir de la solicitud y envía el token de verificación por email.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Solicitud aprobada y usuario creado' },
          403: { description: 'No autorizado (Requiere Admin)' },
          404: { description: 'Solicitud no encontrada' },
        },
      },
    },
    '/auth/signup-requests/{id}/reject': {
      post: {
        tags: ['Registration (Admin)'],
        summary: 'Rechazar una solicitud de registro (Requiere Rol Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Solicitud rechazada' },
          403: { description: 'No autorizado (Requiere Admin)' },
          404: { description: 'Solicitud no encontrada' },
        },
      },
    },
    '/auth/signup-requests/status/{email}': {
      get: {
        tags: ['Registration (Public)'],
        summary: 'Consultar el estado de una solicitud de registro (Público)',
        description:
          'Permite al solicitante saber si su cuenta ya fue creada (VERIFIED), sigue pendiente o fue rechazada. No requiere autenticación.',
        parameters: [
          {
            name: 'email',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'email' },
          },
        ],
        responses: {
          200: {
            description:
              'Estado de la solicitud (VERIFIED, PENDING, REJECTED o NOT_FOUND)',
          },
        },
      },
    },
    // =====================================================
    // PROFILE
    // =====================================================
    '/auth/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Obtiene el perfil del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description:
              'Perfil del usuario (datos personales, foto, rol, estado de verificación)',
          },
          401: { description: 'Token inválido o no provisto' },
        },
      },
    },
    '/auth/profile/by-id': {
      post: {
        tags: ['Profile'],
        summary: 'Obtiene el perfil de un usuario por su ID',
        description:
          'Usado por otros servicios para resolver los datos de un usuario a partir de su userId.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string', example: 'user_premium_1' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Perfil obtenido exitosamente' },
          400: { description: 'userId no proporcionado' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },
    '/users/me': {
      patch: {
        tags: ['Profile'],
        summary: 'Solicita una actualización del perfil propio',
        description:
          'Los cambios NO se aplican de inmediato: quedan como solicitud pendiente que un administrador debe aprobar con `POST /users/update-requests/{id}/approve`.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/UserProfileUpdateRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Solicitud de actualización registrada' },
          401: { description: 'No autorizado' },
        },
      },
    },
    '/users/update-requests': {
      get: {
        tags: ['Users (Admin)'],
        summary:
          'Lista las solicitudes de actualización de perfil (Requiere Rol Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED'],
            },
          },
        ],
        responses: {
          200: { description: 'Lista de solicitudes' },
          403: { description: 'No autorizado (Requiere Admin)' },
        },
      },
    },
    '/users/update-requests/{id}/approve': {
      post: {
        tags: ['Users (Admin)'],
        summary:
          'Aprobar solicitud de actualización de perfil (Requiere Rol Admin)',
        description:
          'Aplica los cambios al usuario. Si cambió el email, se envía un nuevo token de verificación.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Solicitud aprobada. Cambios aplicados' },
          403: { description: 'No autorizado (Requiere Admin)' },
          404: { description: 'Solicitud no encontrada' },
        },
      },
    },
    '/users/update-requests/{id}/reject': {
      post: {
        tags: ['Users (Admin)'],
        summary:
          'Rechazar solicitud de actualización de perfil (Requiere Rol Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Solicitud rechazada' },
          403: { description: 'No autorizado (Requiere Admin)' },
          404: { description: 'Solicitud no encontrada' },
        },
      },
    },
    // =====================================================
    // USERS (ADMIN)
    // =====================================================
    '/users/all': {
      get: {
        tags: ['Users (Admin)'],
        summary:
          'Lista todos los usuarios con perfiles y roles (Requiere Rol Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description:
              'Lista de usuarios (DTO plano: id, name, email, phone, profilePicture, role, isActive, isEmailVerified, fechaNacimiento, dpi, ingresosMensuales, direccion, nombreTrabajo)',
          },
          403: { description: 'Acceso restringido solo para administradores' },
        },
      },
    },
    '/users/{userId}/role': {
      put: {
        tags: ['Users (Admin)'],
        summary: 'Cambia el rol de un usuario existente (Requiere Rol Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'user_regular_5',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['roleName'],
                properties: {
                  roleName: {
                    type: 'string',
                    enum: ['ADMIN_ROLE', 'EMPLOYEE_ROLE', 'USER_ROLE'],
                    example: 'EMPLOYEE_ROLE',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Rol actualizado' },
          403: { description: 'No autorizado (Requiere Admin)' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },
    '/users/{userId}/roles': {
      get: {
        tags: ['Users (Admin)'],
        summary: 'Obtiene los roles de un usuario',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'user_premium_1',
          },
        ],
        responses: {
          200: {
            description: 'Arreglo con los nombres de los roles',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['USER_ROLE'],
                },
              },
            },
          },
          401: { description: 'Token inválido o no provisto' },
        },
      },
    },
    '/users/by-role/{roleName}': {
      get: {
        tags: ['Users (Admin)'],
        summary:
          'Lista los usuarios que tienen un rol específico (Requiere Rol Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'roleName',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['ADMIN_ROLE', 'EMPLOYEE_ROLE', 'USER_ROLE'],
            },
          },
        ],
        responses: {
          200: { description: 'Lista de usuarios con ese rol' },
          403: { description: 'No autorizado (Requiere Admin)' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token devuelto por POST /auth/login',
      },
    },
    schemas: {
      AuthRegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'phone'],
        properties: {
          name: { type: 'string', example: 'Juan Perez' },
          email: { type: 'string', format: 'email', example: 'juan@email.com' },
          password: { type: 'string', minLength: 8, example: 'S3gura123!' },
          phone: {
            type: 'string',
            example: '12345678',
            description: '8 dígitos',
          },
          profilePicture: {
            type: 'string',
            format: 'binary',
            description: 'Formatos permitidos: jpg, jpeg, png, webp, jfif',
          },
        },
      },
      AuthLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'premium1@test.com',
          },
          password: { type: 'string', example: 'Admin1234!' },
        },
      },
      AuthTokenRequest: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', example: 'token_verificacion' },
        },
      },
      AuthEmailRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan@email.com' },
        },
      },
      AuthResetPasswordRequest: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string', example: 'token_reset' },
          newPassword: {
            type: 'string',
            minLength: 8,
            example: 'NuevaClave123!',
          },
        },
      },
      UserProfileUpdateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Juan M.' },
          email: { type: 'string', example: 'nuevo@email.com' },
          phone: { type: 'string', example: '87654321' },
          profilePicture: { type: 'string', format: 'binary' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [],
};

export default swaggerJSDoc(options);
