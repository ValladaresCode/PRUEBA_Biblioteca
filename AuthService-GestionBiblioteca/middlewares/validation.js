import { body, query, validationResult } from 'express-validator';

/**
 * Middleware para procesar resultados de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

/**
 * Validaciones para el registro de usuario
 */
/**
 * Validaciones para el registro de usuario
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio')
    .isEmail()
    .withMessage('El correo electrónico no tiene un formato válido')
    .isLength({ max: 150 })
    .withMessage('El correo electrónico no puede tener más de 150 caracteres'),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 8, max: 255 })
    .withMessage('La contraseña debe tener entre 8 y 255 caracteres'),

  body('phone')
    .notEmpty()
    .withMessage('El número de teléfono es obligatorio')
    .matches(/^\d{8}$/)
    .withMessage('El número de teléfono debe tener exactamente 8 dígitos'),

  body('fechaNacimiento')
    .notEmpty()
    .withMessage('La fecha de nacimiento es obligatoria')
    .isISO8601()
    .withMessage('Debe proporcionar una fecha de nacimiento válida')
    // 18+ se valida aquí (cubre /register y /signup-request): rechazar en el
    // submit, nunca después de que un admin ya aprobó la solicitud.
    .custom((value) => {
      // Todo en UTC: 'YYYY-MM-DD' se parsea como UTC; mezclar getters locales
      // corre el cumpleaños un día en zonas negativas (Guatemala, UTC-6).
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
      const m = today.getUTCMonth() - birthDate.getUTCMonth();
      if (m < 0 || (m === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
        age--;
      }
      if (age < 18) {
        throw new Error('Debes ser mayor de 18 años para registrarte');
      }
      return true;
    }),

  body('dpi')
    .notEmpty()
    .withMessage('El DPI es obligatorio')
    .matches(/^\d{13}$/)
    .withMessage('El DPI debe tener exactamente 13 dígitos'),

  body('ingresosMensuales')
    .notEmpty()
    .withMessage('Los ingresos mensuales son obligatorios')
    .isNumeric()
    .withMessage('Los ingresos mensuales deben ser un número')
    // min alineado con UserProfile.IngresosMensuales (min: 0.01): con 0 el
    // validador pasaba pero el modelo reventaba recién al crear el usuario.
    .isFloat({ min: 0.01 })
    .withMessage('Los ingresos mensuales deben ser mayores a 0'),

  body('direccion')
    .trim()
    .notEmpty()
    .withMessage('La dirección es obligatoria')
    .isLength({ max: 255 })
    .withMessage('La dirección no puede exceder 255 caracteres'),

  body('nombreTrabajo')
    .trim()
    .notEmpty()
    .withMessage('La ocupación es obligatoria')
    .isLength({ max: 100 })
    .withMessage('La ocupación no puede exceder 100 caracteres'),

  handleValidationErrors,
];
/**
 * Validaciones para el login
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('El email no tiene un formato válido'),

  body('password').notEmpty().withMessage('La contraseña es requerida'),

  handleValidationErrors,
];

/**
 * Validaciones para verificación de email
 */
export const validateVerifyEmail = [
  body('token').notEmpty().withMessage('El token de verificación es requerido'),

  handleValidationErrors,
];

/**
 * Validaciones para reenvío de verificación
 */
export const validateResendVerification = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('Debe proporcionar un email válido'),

  handleValidationErrors,
];

/**
 * Validaciones para forgot password
 */
export const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('Debe proporcionar un email válido'),

  handleValidationErrors,
];

/**
 * Validaciones para reset password
 */
export const validateResetPassword = [
  body('token').notEmpty().withMessage('El token de recuperación es requerido'),

  body('newPassword')
    .notEmpty()
    .withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres'),

  handleValidationErrors,
];

/**
 * Validaciones para consultar el estado de un token de reset (polling)
 */
export const validateResetPasswordStatus = [
  query('token')
    .notEmpty()
    .withMessage('El token de recuperación es requerido')
    .isLength({ min: 20 })
    .withMessage('El token de recuperación no tiene un formato válido'),

  handleValidationErrors,
];

/**
 * Validaciones para actualizar perfil
 */
export const validateUpdateUser = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El correo electrónico no tiene un formato válido')
    .isLength({ max: 150 })
    .withMessage('El correo electrónico no puede tener más de 150 caracteres'),

  body('phone')
    .optional()
    .matches(/^\d{8}$/)
    .withMessage('El número de teléfono debe tener exactamente 8 dígitos'),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La dirección no puede exceder 255 caracteres'),

  body('nombreTrabajo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El nombre de trabajo no puede exceder 100 caracteres'),

  body('ingresosMensuales')
    .optional()
    .isNumeric()
    .withMessage('Los ingresos mensuales deben ser un número')
    .isFloat({ min: 0 })
    .withMessage('Los ingresos mensuales no pueden ser negativos'),

  body('newPassword')
    .optional()
    .isLength({ min: 8, max: 255 })
    .withMessage('La contraseña debe tener entre 8 y 255 caracteres'),

  body('currentPassword')
    .if(body('newPassword').exists())
    .notEmpty()
    .withMessage('La contraseña actual es obligatoria'),

  handleValidationErrors,
];
