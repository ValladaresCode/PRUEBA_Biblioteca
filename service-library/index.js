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

// Iniciar el servidor. El await es obligatorio para que el proceso no termine
// antes de que app.listen() sea invocado.
await initServer();
