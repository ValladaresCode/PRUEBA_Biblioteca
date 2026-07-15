import { Router } from 'express'

import { handleValidationErrors } from '../../middlewares/handle-validation-errors.js'
import { login, register } from './auth.controller.js'
import { loginValidators, registerValidators } from './auth.validators.js'

export const authRouter = Router()

authRouter.post('/register', registerValidators, handleValidationErrors, register)
authRouter.post('/login', loginValidators, handleValidationErrors, login)
