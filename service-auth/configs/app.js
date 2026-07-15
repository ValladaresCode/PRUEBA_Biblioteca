import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'

import { authRouter } from '../src/auth/auth.routes.js'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde',
  },
})

export const createApp = () => {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(morgan('dev'))
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Auth service en funcionamiento',
      data: {
        service: 'biblioteca-auth-service',
        uptime: process.uptime(),
      },
    })
  })

  app.use('/api/v1/auth', authLimiter, authRouter)

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    })
  })

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error)
    }

    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({
        success: false,
        message: 'El cuerpo de la solicitud no es un JSON válido',
      })
    }

    // No exponemos stack traces ni detalles internos de PostgreSQL al cliente.
    console.error('Error no controlado:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    })
  })

  return app
}
