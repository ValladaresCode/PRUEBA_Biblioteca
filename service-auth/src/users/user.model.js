import { DataTypes, Model } from 'sequelize'

import { sequelize } from '../../configs/db.js'

export class User extends Model {
  // Representación pública: nunca incluye la contraseña.
  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
    }
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'LIBRARIAN_ROLE',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    defaultScope: {
      // Por defecto nunca devolvemos el hash de la contraseña.
      attributes: { exclude: ['password'] },
    },
    scopes: {
      // Scope explícito para el login, donde sí necesitamos el hash.
      withPassword: {
        attributes: { include: ['password'] },
      },
    },
  },
)
