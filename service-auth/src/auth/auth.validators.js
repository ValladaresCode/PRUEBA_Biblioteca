import { body } from 'express-validator'

export const registerValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El correo es obligatorio')
    .isEmail()
    .withMessage('El correo no tiene un formato válido')
    .toLowerCase(),
  body('password')
    .isString()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
]

export const loginValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El correo es obligatorio')
    .isEmail()
    .withMessage('El correo no tiene un formato válido')
    .toLowerCase(),
  body('password')
    .isString()
    .withMessage('La contraseña es obligatoria')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
]
