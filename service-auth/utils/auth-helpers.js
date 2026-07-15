import crypto from 'crypto';

// Generate secure tokens matching .NET TokenGenerator
export const generateEmailVerificationToken = () => {
  return generateSecureToken(32); // 32 bytes = 256 bits
};

export const generatePasswordResetToken = () => {
  return generateSecureToken(32); // 32 bytes = 256 bits
};

// Refresh token opaco (48 bytes = 384 bits). Se entrega en claro al cliente
// (cookie/body) pero en la BD se guarda SOLO su hash SHA-256.
export const generateRefreshToken = () => {
  return generateSecureToken(48);
};

// Hash determinista para buscar/almacenar el refresh token sin exponerlo.
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate secure token exactly like .NET TokenGenerator
const generateSecureToken = (length) => {
  const bytes = crypto.randomBytes(length);
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};
