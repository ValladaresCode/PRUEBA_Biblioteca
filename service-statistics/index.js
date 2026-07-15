import dotenv from 'dotenv';
import { initServer } from './configs/app.js';

// Cargar variables de entorno desde .env
dotenv.config();

// Manejo de errores no capturados a nivel de proceso.
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

initServer();
