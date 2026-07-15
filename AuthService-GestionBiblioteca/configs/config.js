import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    // Vida del access token. generate-jwt.js lee config.jwt.expiresIn.
    // Default alto (12h) para coexistir con el movil hasta que tenga su propio refresh.
    expiresIn:
      process.env.ACCESS_TOKEN_EXPIRES_IN ||
      process.env.JWT_EXPIRES_IN ||
      '12h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  },

  // Refresh token cookie (HttpOnly). Se envia/lee solo bajo /api/v1/auth.
  cookie: {
    name: 'refreshToken',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'none' exige Secure (prod, cross-site). En dev 'lax' basta (mismo site localhost).
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias en ms
    path: '/api/v1/auth',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },

  // SMTP Configuration (aligned with .NET SmtpSettings)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    enableSsl: process.env.SMTP_ENABLE_SSL === 'true',
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    fromEmail: process.env.EMAIL_FROM,
    fromName: process.env.EMAIL_FROM_NAME,
  },

  // File Upload Configuration (aligned with .NET FileValidator)
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB (aligned with .NET)
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/jfif',
    ], // aligned with .NET
    // Ensure we always have a folder to store multipart/form-data uploads
    uploadPath: process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads'),
  },

  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
    baseUrl: process.env.CLOUDINARY_BASE_URL?.trim(),
    // Expand nested env references if not supported by dotenv
    // If CLOUDINARY_DEFAULT_AVATAR contains ${...}, build it from folder + filename
    defaultAvatarPath:
      process.env.CLOUDINARY_DEFAULT_AVATAR &&
      !process.env.CLOUDINARY_DEFAULT_AVATAR.includes('${')
        ? process.env.CLOUDINARY_DEFAULT_AVATAR
        : [
            process.env.CLOUDINARY_FOLDER,
            process.env.CLOUDINARY_DEFAULT_AVATAR_FILENAME,
          ]
            .filter(Boolean)
            .join('/'),
    folder: process.env.CLOUDINARY_FOLDER?.trim(),
  },

  // Rate Limiting
  rateLimit: {
    // API general: 40 requests por minuto
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 40,
    // Endpoints de auth: 40/min (igual que la API general; la app móvil aún
    // no tiene refresh token y reintenta login — bajar recién cuando lo tenga)
    authWindowMs: 1 * 60 * 1000, // 1 minute
    authMaxRequests: 40,
    // Endpoints de email: 3 cada 15 min (anti-spam de correos)
    emailWindowMs: 15 * 60 * 1000, // 15 minutes
    emailMaxRequests: 3,
  },

  // Security (aligned with .NET Security configuration)
  security: {
    saltRounds: 12,
    maxLoginAttempts: 5,
    lockoutTime: 30 * 60 * 1000,
    passwordMinLength: 8,
    // IP Filtering (aligned with .NET IpFilteringMiddleware)
    blacklistedIPs: process.env.BLACKLISTED_IPS
      ? process.env.BLACKLISTED_IPS.split(',').map((ip) => ip.trim())
      : [],
    whitelistedIPs: process.env.WHITELISTED_IPS
      ? process.env.WHITELISTED_IPS.split(',').map((ip) => ip.trim())
      : [],
    restrictedPaths: process.env.RESTRICTED_PATHS
      ? process.env.RESTRICTED_PATHS.split(',').map((path) => path.trim())
      : [],
  },

  // App Settings (aligned with .NET AppSettings)
  app: {
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL || process.env.API_URL,
    // Scheme de deep linking de la app movil (para enlaces universales de reset).
    mobileScheme: process.env.MOBILE_APP_SCHEME || 'bancariomovil',
  },

  // Security Settings (aligned with .NET Security config)
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : [],
    adminAllowedOrigins: process.env.ADMIN_ALLOWED_ORIGINS
      ? process.env.ADMIN_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : [],
  },

  // Verification tokens
  verification: {
    // Read expirations from env (hours) for easy configuration and parity with .NET
    emailTokenExpiry:
      (process.env.VERIFICATION_EMAIL_EXPIRY_HOURS
        ? parseInt(process.env.VERIFICATION_EMAIL_EXPIRY_HOURS, 10)
        : 24) *
      60 *
      60 *
      1000,
    passwordResetExpiry:
      (process.env.PASSWORD_RESET_EXPIRY_HOURS
        ? parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS, 10)
        : 1) *
      60 *
      60 *
      1000,
  },
};
