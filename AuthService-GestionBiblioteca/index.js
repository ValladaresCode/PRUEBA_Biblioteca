import dotenv from 'dotenv';
import { initServer } from './configs/app.js';
import { sequelize } from './configs/db.js';
import './src/users/user.model.js';
import './src/users/user-update-request.model.js';
import './src/auth/role.model.js';
import './src/auth/signup-request.model.js';
import './src/auth/refresh-token.model.js';
import { seedData } from './helpers/data-seeder.js';

// Configurar variables de entorno
dotenv.config();

await sequelize.authenticate();
await sequelize.sync({ alter: true });
await seedData();

// Manejar errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

// Inicializar servidor
// IMPORTANTE: await es obligatorio. Sin él, el módulo termina antes de que
// app.listen() sea llamado → el event loop queda vacío → proceso termina (código 0).
await initServer();
