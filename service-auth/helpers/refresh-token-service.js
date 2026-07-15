import { Op } from 'sequelize';
import { RefreshToken } from '../src/auth/refresh-token.model.js';
import { generateRefreshToken, hashToken } from '../utils/auth-helpers.js';
import { generateShortUUID } from './uuid-generator.js';
import { config } from '../configs/config.js';

// Convierte '7d' | '15m' | '12h' | '30s' a milisegundos. Default 7 dias.
const parseDurationMs = (value) => {
  if (typeof value !== 'string') return 7 * 24 * 60 * 60 * 1000;
  const match = value.trim().match(/^(\d+)\s*([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return amount * factor;
};

const getMeta = (req) => ({
  UserAgent: req?.headers?.['user-agent']?.slice(0, 256) || null,
  IpAddress: (req?.ip || req?.socket?.remoteAddress || '').slice(0, 64) || null,
});

/**
 * Emite un refresh token nuevo, lo persiste hasheado y devuelve el valor en claro.
 * Sin `family` inicia una cadena nueva (login); con `family` continua la cadena (rotacion).
 */
export const issueRefreshToken = async (userId, { family, req } = {}) => {
  const plaintext = generateRefreshToken();
  const tokenHash = hashToken(plaintext);
  const chain = family || generateShortUUID();
  const expiresAt = new Date(
    Date.now() + parseDurationMs(config.jwt.refreshExpiresIn)
  );

  await RefreshToken.create({
    UserId: userId,
    TokenHash: tokenHash,
    Family: chain,
    ExpiresAt: expiresAt,
    ...getMeta(req),
  });

  return { plaintext, expiresAt, family: chain };
};

/**
 * Revoca TODA una familia (cadena de rotacion). Se usa en logout (cierre de la
 * sesion actual) y ante deteccion de reuso (posible robo).
 */
export const revokeFamily = async (family, reason = 'revoked') => {
  await RefreshToken.update(
    { Revoked: true, RevokedAt: new Date(), RevokeReason: reason },
    { where: { Family: family, Revoked: false } }
  );
};

/**
 * Rota un refresh token: valida el actual, lo marca como rotado y emite uno nuevo
 * dentro de la misma familia. Lanza Error con .status para el controller.
 */
export const rotateRefreshToken = async (plaintext, req) => {
  if (!plaintext) {
    const err = new Error('No hay refresh token en la peticion');
    err.status = 401;
    throw err;
  }

  const tokenHash = hashToken(plaintext);
  const row = await RefreshToken.findOne({ where: { TokenHash: tokenHash } });

  if (!row) {
    const err = new Error('Refresh token invalido');
    err.status = 401;
    throw err;
  }

  // Reuso de un token ya rotado/revocado => posible robo: revocar toda la familia.
  if (row.Revoked) {
    await revokeFamily(row.Family, 'reuse');
    const err = new Error(
      'Refresh token reutilizado. Sesion revocada por seguridad.'
    );
    err.status = 401;
    throw err;
  }

  if (row.ExpiresAt.getTime() <= Date.now()) {
    const err = new Error('Refresh token expirado');
    err.status = 401;
    throw err;
  }

  // Emite el nuevo en la misma familia y marca el actual como rotado.
  const next = await issueRefreshToken(row.UserId, { family: row.Family, req });

  row.Revoked = true;
  row.RevokedAt = new Date();
  row.RevokeReason = 'rotated';
  row.ReplacedByHash = hashToken(next.plaintext);
  await row.save();

  return {
    userId: row.UserId,
    family: row.Family,
    newPlaintext: next.plaintext,
    newExpiresAt: next.expiresAt,
  };
};

/**
 * Logout: revoca la familia del token presentado (cierra la sesion actual).
 * No lanza si el token ya no existe (idempotente).
 */
export const revokeByToken = async (plaintext) => {
  if (!plaintext) return;
  const tokenHash = hashToken(plaintext);
  const row = await RefreshToken.findOne({ where: { TokenHash: tokenHash } });
  if (row) {
    await revokeFamily(row.Family, 'logout');
  }
};

// Limpieza opcional de tokens vencidos (puede llamarse desde un cron si se desea).
export const purgeExpiredRefreshTokens = async () => {
  await RefreshToken.destroy({ where: { ExpiresAt: { [Op.lt]: new Date() } } });
};
