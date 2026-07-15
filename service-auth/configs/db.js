import { Sequelize } from 'sequelize'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno')
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.DB_SQL_LOGGING === 'true' ? console.log : false,
})

export const dbConnection = async () => {
  // authenticate() falla si PostgreSQL no está disponible; dejamos propagar el
  // error para no arrancar Auth sin conexión.
  await sequelize.authenticate()

  // Para esta actividad sincronizamos el esquema automáticamente.
  await sequelize.sync()

  console.log('PostgreSQL conectado (auth)')
}
