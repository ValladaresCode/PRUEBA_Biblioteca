'use strict';

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de PostgreSQL (igual que la API .NET)
const dbUrl = process.env.DATABASE_URL;

export const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      dialect: 'postgres',
      logging: process.env.DB_SQL_LOGGING === 'true' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      define: {
        freezeTableName: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      logging: process.env.DB_SQL_LOGGING === 'true' ? console.log : false,
      define: {
        freezeTableName: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

// Función para conectar a la base de datos
export const dbConnection = async () => {
  try {
    console.log('PostgreSQL | Trying to connect...');

    await sequelize.authenticate();
    console.log('PostgreSQL | Connected to PostgreSQL');
    console.log('PostgreSQL | Connection to database established');

    // Sincronizar modelos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const syncLogging =
        process.env.DB_SQL_LOGGING === 'true' ? console.log : false;
      await sequelize.sync({ alter: true, logging: syncLogging });
      console.log('PostgreSQL | Models synchronized with database');
    }
  } catch (error) {
    console.error('PostgreSQL | Could not connect to PostgreSQL');
    console.error('PostgreSQL | Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(
    `PostgreSQL | Received ${signal}. Closing database connection...`
  );
  try {
    await sequelize.close();
    console.log('PostgreSQL | Database connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error(
      'PostgreSQL | Error during graceful shutdown:',
      error.message
    );
    process.exit(1);
  }
};

// Handle different termination signals
// SIGINT: Ctrl+C — aplica en todos los entornos.
// SIGTERM: En producción es la señal estándar de apagado del proceso manager.
//          En desarrollo, nodemon usa SIGTERM/SIGUSR2 en Windows para reiniciar:
//          interceptarlo causa que el proceso salga con código 0 (clean exit)
//          y nodemon queda esperando cambios en lugar de mantener el servidor activo.
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}
