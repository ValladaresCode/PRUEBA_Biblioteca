'use strict';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import statisticsRoutes from '../src/statistics/statistics.routes.js';

const BASE_PATH = '/api/v1';

/**
 * Registra los middlewares globales del servicio.
 */
const middlewares = (app) => {
  app.use(helmet());
  app.use(cors());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

/**
 * Registra las rutas del servicio, incluido el health check público.
 */
const routes = (app) => {
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'Healthy',
      service: 'Statistics Service',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(BASE_PATH, statisticsRoutes);
};

/**
 * Manejador 404 para rutas no encontradas.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Recurso no encontrado',
    errors: [],
  });
};

/**
 * Manejador de errores central. Devuelve el formato común de error y nunca
 * expone stack traces. Los errores de statistics.service.js (Library caído)
 * llegan con statusCode 503; el resto se trata como error interno (500).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('Statistics Service | Error:', err.message);

  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 503 ? err.message : 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
    errors: [],
  });
};

/**
 * Inicializa el servidor: registra middlewares, rutas y manejadores de error,
 * y comienza a escuchar en el puerto configurado. No requiere base de datos.
 */
export const initServer = () => {
  const app = express();
  const PORT = process.env.PORT || 4002;

  middlewares(app);
  routes(app);

  // 404 y error handler siempre al final.
  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Statistics Service escuchando en el puerto ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Resumen: http://localhost:${PORT}${BASE_PATH}/summary`);
  });
};
