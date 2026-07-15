'use strict';

import mongoose from 'mongoose';

/**
 * Conecta el servicio a MongoDB usando Mongoose.
 *
 * Se debe llamar ANTES de app.listen() para garantizar que las consultas
 * (por ejemplo GET /api/v1/books) tengan una conexion disponible.
 */
export const dbConnection = async () => {
  const uri = process.env.URI_MONGO;

  if (!uri) {
    throw new Error('Falta la variable de entorno URI_MONGO');
  }

  console.log('MongoDB | Intentando conectar...');
  await mongoose.connect(uri);
  console.log('MongoDB | Conexion establecida con la base de datos');
};

/**
 * Cierra la conexion a MongoDB de forma ordenada al recibir una senal
 * de terminacion (Ctrl+C, etc.).
 */
const gracefulShutdown = async (signal) => {
  console.log(`MongoDB | Recibida senal ${signal}. Cerrando conexion...`);
  try {
    await mongoose.connection.close();
    console.log('MongoDB | Conexion cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('MongoDB | Error al cerrar la conexion:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
