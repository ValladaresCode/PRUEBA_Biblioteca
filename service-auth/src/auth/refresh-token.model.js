import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { generateUserId } from '../../helpers/uuid-generator.js';
import { User } from '../users/user.model.js';

// Lista de revocacion de refresh tokens (RTR).
// El token en claro nunca se guarda: solo su hash SHA-256 (TokenHash).
// Cada login abre una "familia" (Family); la rotacion encadena tokens dentro
// de la misma familia. Si se reutiliza un token ya rotado, se revoca la familia.
export const RefreshToken = sequelize.define(
  'RefreshToken',
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
    TokenHash: {
      type: DataTypes.STRING(64), // sha256 hex = 64 chars
      allowNull: false,
      field: 'token_hash',
    },
    Family: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'family',
    },
    ExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    Revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'revoked',
    },
    RevokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at',
    },
    RevokeReason: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'revoke_reason', // 'rotated' | 'logout' | 'reuse'
    },
    ReplacedByHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'replaced_by_hash',
    },
    UserAgent: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'user_agent',
    },
    IpAddress: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'ip_address',
    },
  },
  {
    tableName: 'refresh_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['token_hash'] },
      { fields: ['family'] },
      { fields: ['user_id'] },
    ],
  }
);

// Asociaciones (registradas junto al resto de modelos, patron user.model.js / role.model.js)
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'RefreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
