import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
  authRateLimit,
  requestLimit,
  statusPollRateLimit,
} from '../../middlewares/request-limit.js';
import { upload, handleUploadError } from '../../helpers/file-upload.js';
import { requireAdmin } from '../../middlewares/require-admin.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword,
  validateResetPasswordStatus,
} from '../../middlewares/validation.js';
import {
  submitSignupRequest,
  listPendingRequests,
  approveRequest,
  rejectRequest,
  checkRequestStatus,
} from './signup-request.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Registra un nuevo usuario
 *     description: Crea una nueva cuenta de usuario con validaciones de seguridad
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: name
 *         in: formData
 *         required: true
 *         type: string
 *         description: Nombre del usuario
 *       - name: name
 *         in: formData
 *         required: true
 *         type: string
 *         description: Nombre del usuario
 *       - name: email
 *         in: formData
 *         required: true
 *         type: string
 *         description: Email del usuario
 *       - name: password
 *         in: formData
 *         required: true
 *         type: string
 *         description: Contraseña (mínimo 8 caracteres)
 *       - name: phone
 *         in: formData
 *         required: true
 *         type: string
 *         description: Teléfono (8 dígitos)
 *       - name: profilePicture
 *         in: formData
 *         type: file
 *         description: Imagen de perfil (opcional)
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Errores de validación
 *       409:
 *         description: Email ya existe
 */
router.post(
  '/register',
  authRateLimit,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'imagen', maxCount: 1 },
  ]),
  handleUploadError,
  validateRegister,
  authController.register
);

// Flujo de solicitud: el cliente crea solicitud y un admin la aprueba y envía token
router.post(
  '/signup-request',
  authRateLimit,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'imagen', maxCount: 1 },
  ]),
  handleUploadError,
  validateRegister,
  submitSignupRequest
);

router.get('/signup-requests', validateJWT, requireAdmin, listPendingRequests);

router.post(
  '/signup-requests/:id/approve',
  validateJWT,
  requireAdmin,
  approveRequest
);

router.post(
  '/signup-requests/:id/reject',
  validateJWT,
  requireAdmin,
  rejectRequest
);

// Excluida del limiter global (skip en requestLimit): usa su propio limiter
// para que el polling de activación no deje en 429 al resto de la API.
router.get(
  '/signup-requests/status/:email',
  statusPollRateLimit,
  checkRequestStatus
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Autentica un usuario
 *     description: Inicia sesión con email y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 *       423:
 *         description: Cuenta bloqueada
 */
router.post('/login', authRateLimit, validateLogin, authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Renueva el access token (rotacion de refresh token)
 *     description: Lee el refresh token de la cookie HttpOnly (web) o del body (movil), lo rota y devuelve un nuevo access token.
 *     responses:
 *       200:
 *         description: Token renovado
 *       401:
 *         description: Refresh token invalido, expirado o reutilizado
 */
router.post('/refresh', authRateLimit, authController.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Cierra la sesion
 *     description: Revoca la familia del refresh token presentado y limpia la cookie.
 *     responses:
 *       200:
 *         description: Sesion cerrada
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verifica el email del usuario
 *     description: Confirma la dirección de email usando el token enviado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de verificación de email
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post(
  '/verify-email',
  requestLimit, // Match .NET ApiPolicy (20 tokens per minute)
  validateVerifyEmail,
  authController.verifyEmail
);

router.get(
  '/verify-email',
  requestLimit, // Match .NET ApiPolicy (20 tokens per minute)
  authController.verifyEmailLink
);

/**
 * @swagger
 * /api/v1/auth/resend-verification:
 *   post:
 *     tags: [Authentication]
 *     summary: Reenvía el email de verificación
 *     description: Envía nuevamente el email de verificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email del usuario
 *     responses:
 *       200:
 *         description: Email reenviado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.post(
  '/resend-verification',
  authRateLimit, // Match .NET AuthPolicy (5 req/min)
  validateResendVerification,
  authController.resendVerification
);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Inicia recuperación de contraseña
 *     description: Envía email con token para resetear contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email del usuario
 *     responses:
 *       200:
 *         description: Instrucciones enviadas al email
 */
router.post(
  '/forgot-password',
  authRateLimit, // Match .NET AuthPolicy (5 req/min)
  validateForgotPassword,
  authController.forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Resetea la contraseña
 *     description: Cambia la contraseña usando el token de recuperación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de recuperación de contraseña
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post(
  '/reset-password',
  authRateLimit,
  validateResetPassword,
  authController.resetPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password/status:
 *   get:
 *     tags: [Authentication]
 *     summary: Consulta el estado de un token de reset (sin consumirlo)
 *     description: Usado para polling desde clientes (detecta si el token ya fue usado desde otro dispositivo). Sin authRateLimit, igual que /signup-requests/status, para no compartir cupo con login/refresh.
 *     responses:
 *       200:
 *         description: Estado del token (pending | used | expired | invalid)
 */
router.get(
  '/reset-password/status',
  validateResetPasswordStatus,
  authController.getResetPasswordStatus
);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Obtiene el perfil del usuario
 *     description: Devuelve la información del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Email no verificado
 */
router.get('/profile', validateJWT, authController.getProfile);

/**
 * @swagger
 * /api/v1/auth/profile/by-id:
 *   post:
 *     tags: [Profile]
 *     summary: Obtiene el perfil del usuario por ID
 *     description: Devuelve la información del usuario basándose en el userId proporcionado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *       400:
 *         description: userId no proporcionado
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/profile/by-id', requestLimit, authController.getProfileById);

export default router;
