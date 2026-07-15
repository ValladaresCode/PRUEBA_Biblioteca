'use strict';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { dbConnection } from './db.js';
// Se importan los modelos para asegurar su registro en Mongoose.
import '../src/books/book.model.js';
import '../src/loans/loan.model.js';
import bookRoutes from '../src/books/book.routes.js';
import loanRoutes, { returnRoutes } from '../src/loans/loan.routes.js';

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
 * Registra las rutas del servicio, incluido el health check publico.
 */
const routes = (app) => {
  // Health check publico (no requiere autenticacion).
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'Healthy',
      service: 'Library Service',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(`${BASE_PATH}/books`, bookRoutes);
  app.use(`${BASE_PATH}/loans`, loanRoutes);
  app.use(`${BASE_PATH}/returns`, returnRoutes);
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
 * Manejador de errores central. Devuelve el formato comun de error.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('Library Service | Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    errors: [],
  });
};

/**
 * Inicializa el servidor: conecta a MongoDB ANTES de escuchar peticiones y
 * registra middlewares, rutas y manejadores de error.
 */
export const initServer = async () => {
  const app = express();
  const PORT = process.env.PORT || 4001;

  try {
    // Conectar a MongoDB antes de app.listen().
    await dbConnection();

    middlewares(app);
    routes(app);

    // 404 y error handler siempre al final.
    app.use(notFound);
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Library Service escuchando en el puerto ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log(`Libros: http://localhost:${PORT}${BASE_PATH}/books`);
    });
  } catch (err) {
    console.error(`Error al iniciar Library Service: ${err.message}`);
    process.exit(1);
  }
};
