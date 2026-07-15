import 'dotenv/config'

import { createApp } from './configs/app.js'
import { dbConnection } from './configs/db.js'
// Registrar el modelo antes de sincronizar el esquema en dbConnection().
import './src/users/user.model.js'

const main = async () => {
  await dbConnection()

  const app = createApp()
  const port = process.env.PORT || 4000

  app.listen(port, () => {
    console.log(`Auth service escuchando en http://localhost:${port}`)
  })
}

main().catch((error) => {
  console.error('No fue posible iniciar el Auth service:', error.message)
  process.exit(1)
})
