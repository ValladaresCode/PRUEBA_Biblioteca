import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { generateUserId } from '../../helpers/uuid-generator.js';
import { User } from './user.model.js';

export const UserUpdateRequest = sequelize.define(
  'UserUpdateRequest',
  {
    Id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      field: 'id',
      defaultValue: () => generateUserId(),
    },
    UserId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'user_id',
      references: {
        model: User,
        key: 'id',
      },
    },
    Email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: 'email',
      validate: { isEmail: true },
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'name',
    },
    Phone: {
      type: DataTypes.STRING(8),
      allowNull: true,
      field: 'phone',
    },
    PasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_hash',
    },
    ProfilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_picture',
    },
    IngresosMensuales: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: 'ingresos_mensuales',
      validate: {
        min: {
          args: [0.01],
          msg: 'Los ingresos mensuales deben ser mayores a 0.',
        },
      },
    },
    Direccion: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'direccion',
    },
    NombreTrabajo: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'nombre_trabajo',
    },
    Status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
      field: 'status',
    },
    ApprovedBy: {
      type: DataTypes.STRING(16),
      allowNull: true,
      field: 'approved_by',
    },
    ApprovedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
  },
  {
    tableName: 'user_update_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
