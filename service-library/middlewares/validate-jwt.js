/**
 * Middleware de autenticacion JWT para el Servicio Library.
 *
 * Valida el JWT emitido por el Servicio Auth (contrato congelado del Sprint 2):
 *
 *   Authorization: Bearer <jwt>
 *
 * Verifica firma (JWT_SECRET), emisor (JWT_ISSUER), audiencia (JWT_AUDIENCE) y
 * expiracion. Cuando el token es valido inyecta en la peticion:
 *
 *   req.userId   = decoded.sub
 *   req.userRole = decoded.role
 *
 * No monta rutas. No registra el token en logs. No expone detalles internos de
 * jsonwebtoken al cliente.
 */

import jwt from 'jsonwebtoken';

const BEARER_PREFIX = 'Bearer ';

/**
 * Extrae el token del header Authorization exigiendo el esquema Bearer.
 * Devuelve { token } si el formato es valido, o { error } describiendo el fallo:
 *   'missing' -> no hay header Authorization.
 *   'format'  -> el header existe pero no cumple "Bearer <token>".
 */
const extractBearerToken = (authorization) => {
  if (typeof authorization !== 'string' || authorization.trim() === '') {
    return { error: 'missing' };
  }

  if (!authorization.startsWith(BEARER_PREFIX)) {
    return { error: 'format' };
  }

  const token = authorization.slice(BEARER_PREFIX.length).trim();

  if (token === '') {
    return { error: 'format' };
  }

  return { token };
};

/**
 * Middleware de autenticacion. Poblado por Auth: solo valida, no emite tokens.
 */
export const validateJWT = (req, res, next) => {
  // Se lee process.env en tiempo de ejecucion (no en importacion) para respetar
  // dotenv.config() del entrypoint y no capturar valores antes de que se carguen.
  const secret = process.env.JWT_SECRET;
  const issuer = process.env.JWT_ISSUER;
  const audience = process.env.JWT_AUDIENCE;

  // Falta de configuracion del servidor: no es un fallo del cliente, es 500.
  if (!secret) {
    console.error('Library Service | validateJWT: JWT_SECRET no esta configurado');
    return res.status(500).json({
      success: false,
      message: 'Configuracion de autenticacion incompleta en el servidor',
    });
  }

  const { token, error } = extractBearerToken(req.headers.authorization);

  if (error === 'missing') {
    return res.status(401).json({
      success: false,
      message: 'No hay token en la peticion',
    });
  }

  if (error === 'format') {
    return res.status(401).json({
      success: false,
      message: 'Formato de autorizacion invalido. Se espera: Authorization: Bearer <token>',
    });
  }

  try {
    const decoded = jwt.verify(token, secret, { issuer, audience });

    // El payload debe identificar al usuario (sub) y traer su rol.
    if (!decoded.sub || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Token invalido',
      });
    }

    req.userId = decoded.sub;
    req.userRole = decoded.role;

    return next();
  } catch (err) {
    // No se expone el detalle interno de jsonwebtoken ni el token al cliente.
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token invalido',
    });
  }
};

export default validateJWT;
