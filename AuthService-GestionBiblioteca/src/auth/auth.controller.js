import {
  registerUserHelper,
  loginUserHelper,
  verifyEmailHelper,
  resendVerificationEmailHelper,
  forgotPasswordHelper,
  resetPasswordHelper,
  passwordResetStatusHelper,
} from '../../helpers/auth-operations.js';
import { getUserProfileHelper } from '../../helpers/profile-operations.js';
import { asyncHandler } from '../../middlewares/server-genericError-handler.js';
import {
  issueRefreshToken,
  rotateRefreshToken,
  revokeByToken,
} from '../../helpers/refresh-token-service.js';
import { generateJWT } from '../../helpers/generate-jwt.js';
import { findUserById } from '../../helpers/user-db.js';
import { config } from '../../configs/config.js';

// Opciones de la cookie HttpOnly del refresh token (derivadas de config).
const refreshCookieOptions = () => ({
  httpOnly: config.cookie.httpOnly,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: config.cookie.path,
  domain: config.cookie.domain,
  maxAge: config.cookie.maxAge,
});

// El cliente movil manda 'x-client-type: mobile' para recibir el refresh token
// en el body (SecureStore). La web lo ignora y usa la cookie HttpOnly.
const isMobileClient = (req) => req.headers['x-client-type'] === 'mobile';

export const register = asyncHandler(async (req, res) => {
  try {
    const uploadedFile =
      req.file || req.files?.profilePicture?.[0] || req.files?.imagen?.[0];

    const userData = {
      ...req.body,
      profilePicture: uploadedFile ? uploadedFile.path : null,
    };

    const result = await registerUserHelper(userData);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in register controller:', error);

    let statusCode = 400;
    if (
      error.message.includes('ya está registrado') ||
      error.message.includes('ya está en uso') ||
      error.message.includes('Ya existe un usuario')
    ) {
      statusCode = 409; // Conflict
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error en el registro',
      error: error.message,
    });
  }
});

export const login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUserHelper(email, password);

    // Emitir refresh token (nueva familia) y entregarlo en cookie HttpOnly.
    const { plaintext } = await issueRefreshToken(result.userDetails.id, {
      req,
    });
    res.cookie(config.cookie.name, plaintext, refreshCookieOptions());

    // Dual: el movil recibe el refresh token en el body; la web NO (usa cookie).
    const payload = isMobileClient(req)
      ? { ...result, refreshToken: plaintext }
      : result;

    res.status(200).json(payload);
  } catch (error) {
    console.error('Error in login controller:', error);

    let statusCode = 401;
    if (
      error.message.includes('bloqueada') ||
      error.message.includes('desactivada')
    ) {
      statusCode = 423; // Locked
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error en el login',
      error: error.message,
    });
  }
});

// Rota el refresh token (RTR) y devuelve un nuevo access token.
// Lee el refresh token de la cookie HttpOnly (web) o del body (movil).
export const refresh = asyncHandler(async (req, res) => {
  try {
    const presented =
      req.cookies?.[config.cookie.name] || req.body?.refreshToken;

    const { userId, newPlaintext } = await rotateRefreshToken(presented, req);

    // Regenerar el access token con el claim de rol actual del usuario.
    const user = await findUserById(userId);
    if (!user || !user.IsActive) {
      res.clearCookie(config.cookie.name, refreshCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'Usuario no valido o inactivo',
      });
    }

    const role = user.UserRoles?.[0]?.Role?.Name || 'USER_ROLE';
    const token = await generateJWT(user.Id.toString(), { role });

    // Setear la cookie rotada.
    res.cookie(config.cookie.name, newPlaintext, refreshCookieOptions());

    const body = {
      success: true,
      message: 'Token renovado',
      token,
    };
    // Dual: el movil necesita el nuevo refresh token en el body.
    if (isMobileClient(req)) body.refreshToken = newPlaintext;

    return res.status(200).json(body);
  } catch (error) {
    console.error('Error in refresh controller:', error);
    return res.status(error.status || 401).json({
      success: false,
      message: error.message || 'No se pudo renovar el token',
    });
  }
});

// Logout: revoca la familia de la sesion actual y limpia la cookie.
export const logout = asyncHandler(async (req, res) => {
  try {
    const presented =
      req.cookies?.[config.cookie.name] || req.body?.refreshToken;
    await revokeByToken(presented);
  } catch (error) {
    console.error('Error in logout controller:', error);
  } finally {
    res.clearCookie(config.cookie.name, refreshCookieOptions());
  }
  return res.status(200).json({ success: true, message: 'Sesion cerrada' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;
    const result = await verifyEmailHelper(token);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in verifyEmail controller:', error);

    let statusCode = 400;
    if (error.message.includes('no encontrado')) {
      statusCode = 404;
    } else if (
      error.message.includes('inválido') ||
      error.message.includes('expirado')
    ) {
      statusCode = 401;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error en la verificación',
      error: error.message,
    });
  }
});

export const verifyEmailLink = asyncHandler(async (req, res) => {
  try {
    const token = req.query?.token;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No se encontro el token de verificacion.',
      });
    }

    const result = await verifyEmailHelper(token);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in verifyEmailLink controller:', error);

    let statusCode = 400;
    if (error.message.includes('no encontrado')) {
      statusCode = 404;
    } else if (
      error.message.includes('invalido') ||
      error.message.includes('expirado')
    ) {
      statusCode = 401;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al verificar el correo.',
      error: error.message,
    });
  }
});

export const resendVerification = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const result = await resendVerificationEmailHelper(email);

    // Check result.success to determine status code
    if (!result.success) {
      if (result.message.includes('no encontrado')) {
        return res.status(404).json(result);
      }
      if (result.message.includes('ya ha sido verificado')) {
        return res.status(400).json(result);
      }
      // Email sending failed
      return res.status(503).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in resendVerification controller:', error);

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordHelper(email);

    // forgotPassword always returns success for security, even if user not found
    // But if email sending fails, we should return 503
    if (!result.success && result.data?.initiated === false) {
      return res.status(503).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in forgotPassword controller:', error);

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPasswordHelper(token, newPassword);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in resetPassword controller:', error);

    let statusCode = 400;
    if (error.message.includes('no encontrado')) {
      statusCode = 404;
    } else if (
      error.message.includes('inválido') ||
      error.message.includes('expirado')
    ) {
      statusCode = 401;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al resetear contraseña',
      error: error.message,
    });
  }
});

// Estado de un token de reset, para que los clientes hagan polling sin
// consumir el token (detecta si ya se usó desde otro dispositivo).
export const getResetPasswordStatus = asyncHandler(async (req, res) => {
  const token = req.query?.token;
  const result = await passwordResetStatusHelper(token);
  return res.status(200).json(result);
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.userId; // Viene del middleware validateJWT
  const user = await getUserProfileHelper(userId);

  // Respuesta estandarizada con envelope
  return res.status(200).json({
    success: true,
    message: 'Perfil obtenido exitosamente',
    data: user,
  });
});

export const getProfileById = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'El userId es requerido',
    });
  }

  const user = await getUserProfileHelper(userId);

  // Respuesta estandarizada con envelope
  return res.status(200).json({
    success: true,
    message: 'Perfil obtenido exitosamente',
    data: user,
  });
});
