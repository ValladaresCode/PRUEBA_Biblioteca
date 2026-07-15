import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { generateUserId } from '../../helpers/uuid-generator.js';

export const SignupRequest = sequelize.define(
  'SignupRequest',
  {
    Id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      field: 'id',
      defaultValue: () => generateUserId(),
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name',
    },
    Email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      field: 'email',
      validate: { isEmail: true },
    },
    PasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    Phone: {
      type: DataTypes.STRING(8),
      allowNull: false,
      field: 'phone',
    },
    ProfilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_picture',
    },
    // Sin default: la fecha es obligatoria en el validador de ruta; un
    // default estático convertiría un dato perdido en una fecha plausible.
    FechaNacimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'fecha_nacimiento',
    },
    Dpi: {
      type: DataTypes.STRING(13),
      allowNull: true,
      unique: true,
      field: 'dpi',
    },
    IngresosMensuales: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: 'ingresos_mensuales',
    },
    Direccion: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'direccion',
    },
    NombreTrabajo: {
      type: DataTypes.STRING(100),
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
    VerificationToken: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'verification_token',
    },
    VerificationTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verification_token_expiry',
    },
  },
  {
    tableName: 'signup_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
