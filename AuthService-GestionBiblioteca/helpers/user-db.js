import {
  User,
  UserProfile,
  UserEmail,
  UserPasswordReset,
} from '../src/users/user.model.js';
import { UserRole, Role } from '../src/auth/role.model.js';
import { USER_ROLE } from './role-constants.js';
import { hashPassword } from '../utils/password-utils.js';
import { Op } from 'sequelize';

/**
 * Helper para buscar un usuario por email
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
export const findUserByEmailOrUsername = async (email) => {
  try {
    const user = await User.findOne({
      where: {
        Email: email.toLowerCase(),
      },
      include: [
        { model: UserProfile, as: 'UserProfile' },
        { model: UserEmail, as: 'UserEmail' },
        { model: UserPasswordReset, as: 'UserPasswordReset' },
        {
          model: UserRole,
          as: 'UserRoles',
          include: [{ model: Role, as: 'Role' }],
        },
      ],
    });

    return user;
  } catch (error) {
    console.error('Error buscando usuario:', error);
    throw new Error('Error al buscar usuario');
  }
};

export const findUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      include: [
        { model: UserProfile, as: 'UserProfile' },
        { model: UserEmail, as: 'UserEmail' },
        { model: UserPasswordReset, as: 'UserPasswordReset' },
        {
          model: UserRole,
          as: 'UserRoles',
          include: [{ model: Role, as: 'Role' }],
        },
      ],
    });

    return user;
  } catch (error) {
    console.error('Error buscando usuario por ID:', error);
    throw new Error('Error al buscar usuario');
  }
};

export const checkUserExists = async (email) => {
  try {
    const existingUser = await User.findOne({
      where: {
        Email: email.toLowerCase(),
      },
    });

    return !!existingUser;
  } catch (error) {
    console.error('Error verificando si el usuario existe:', error);
    throw new Error('Error al verificar usuario');
  }
};

/**
 * Verifica si un DPI ya pertenece a un usuario existente.
 * user_profiles.dpi es UNIQUE: sin este chequeo previo, la colisión explota
 * recién al crear el usuario (post-aprobación), dejando la solicitud varada.
 */
export const checkDpiExists = async (dpi) => {
  if (!dpi) return false;
  try {
    const existingProfile = await UserProfile.findOne({
      where: { Dpi: dpi },
    });
    return !!existingProfile;
  } catch (error) {
    console.error('Error verificando DPI:', error);
    throw new Error('Error al verificar DPI');
  }
};

export const createNewUser = async (userData) => {
  const transaction = await User.sequelize.transaction();

  try {
    const {
      name,
      email,
      password,
      phone,
      fechaNacimiento,
      dpi,
      ingresosMensuales,
      direccion,
      nombreTrabajo,
      profilePicture,
      hashedPassword,
    } = userData;

    // Allow passing a pre-hashed password (e.g., from a pending signup request)
    const passwordToStore = hashedPassword
      ? hashedPassword
      : await hashPassword(password);

    // Crear el usuario principal
    const user = await User.create(
      {
        Name: name,
        Email: email.toLowerCase(),
        Password: passwordToStore,
        IsActive: false, // Empieza inactivo hasta que verifique el email
      },
      { transaction }
    );

    // Crear el perfil del usuario
    const { getDefaultAvatarPath } =
      await import('../helpers/cloudinary-service.js');
    const defaultAvatarFilename = getDefaultAvatarPath();

    await UserProfile.create(
      {
        UserId: user.Id,
        Phone: phone,
        FechaNacimiento: fechaNacimiento,
        Dpi: dpi,
        IngresosMensuales: ingresosMensuales,
        Direccion: direccion || null,
        NombreTrabajo: nombreTrabajo || null,
        Imagen: profilePicture || defaultAvatarFilename,
      },
      { transaction }
    );

    // Crear el registro de email
    await UserEmail.create(
      {
        UserId: user.Id,
        EmailVerified: false,
      },
      { transaction }
    );

    // Crear el registro de reset de contraseña
    await UserPasswordReset.create(
      {
        UserId: user.Id,
      },
      { transaction }
    );

    // Asignar rol USER_ROLE por defecto (matching .NET DataSeeder)
    const userRole = await Role.findOne(
      { where: { Name: USER_ROLE } },
      { transaction }
    );
    if (userRole) {
      await UserRole.create(
        {
          UserId: user.Id,
          RoleId: userRole.Id,
        },
        { transaction }
      );
    } else {
      console.warn(
        `USER_ROLE not found in database during user creation for user ${user.Id}`
      );
    }

    await transaction.commit();

    // Obtener el usuario completo con todas las relaciones
    const completeUser = await findUserById(user.Id);
    return completeUser;
  } catch (error) {
    await transaction.rollback();
    console.error('Error creando usuario:', error);
    // Las violaciones de unicidad (email, dpi) deben llegar al cliente como
    // 409 con el campo, no como 500 genérico imposible de diagnosticar.
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path || 'campo único';
      const err = new Error(`Ya existe un usuario con este ${field}`);
      err.status = 409;
      throw err;
    }
    throw new Error('Error al crear usuario');
  }
};

export const updateEmailVerificationToken = async (userId, token, expiry) => {
  try {
    await UserEmail.update(
      {
        EmailVerified: false,
        EmailVerificationToken: token,
        EmailVerificationTokenExpiry: expiry,
      },
      {
        where: { UserId: userId },
      }
    );
  } catch (error) {
    console.error('Error actualizando token de verificación:', error);
    throw new Error('Error al actualizar token de verificación');
  }
};

export const markEmailAsVerified = async (userId) => {
  const transaction = await User.sequelize.transaction();

  try {
    // Marcar email como verificado
    await UserEmail.update(
      {
        EmailVerified: true,
        EmailVerificationToken: null,
        EmailVerificationTokenExpiry: null,
      },
      {
        where: { UserId: userId },
        transaction,
      }
    );

    // Activar el usuario
    await User.update(
      {
        IsActive: true,
      },
      {
        where: { Id: userId },
        transaction,
      }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error marcando email como verificado:', error);
    throw new Error('Error al verificar email');
  }
};

export const updatePasswordResetToken = async (userId, token, expiry) => {
  try {
    await UserPasswordReset.update(
      {
        PasswordResetToken: token,
        PasswordResetTokenExpiry: expiry,
        // Nuevo ciclo de reset: limpiar el flag de uso del token anterior,
        // si no, el endpoint de status y findUserByPasswordResetToken
        // rechazarían este token nuevo como si ya estuviera usado.
        PasswordResetTokenUsedAt: null,
      },
      {
        where: { UserId: userId },
      }
    );
  } catch (error) {
    console.error('Error actualizando token de reset:', error);
    throw new Error('Error al actualizar token de reset');
  }
};

export const findUserByEmail = async (email) => {
  try {
    const user = await User.findOne({
      where: { Email: email.toLowerCase() },
      include: [
        { model: UserProfile, as: 'UserProfile' },
        { model: UserEmail, as: 'UserEmail' },
        { model: UserPasswordReset, as: 'UserPasswordReset' },
        {
          model: UserRole,
          as: 'UserRoles',
          include: [{ model: Role, as: 'Role' }],
        },
      ],
    });

    return user;
  } catch (error) {
    console.error('Error buscando usuario por email:', error);
    throw new Error('Error al buscar usuario');
  }
};

/**
 * Helper para buscar un usuario por token de verificación de email (matching .NET)
 * @param {string} token - Token de verificación de email
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
export const findUserByEmailVerificationToken = async (token) => {
  try {
    const user = await User.findOne({
      include: [
        {
          model: UserEmail,
          as: 'UserEmail',
          where: {
            EmailVerificationToken: token,
            EmailVerificationTokenExpiry: {
              [Op.gt]: new Date(), // Token no expirado
            },
          },
        },
        {
          model: UserProfile,
          as: 'UserProfile',
        },
        {
          model: UserPasswordReset,
          as: 'UserPasswordReset',
        },
      ],
    });

    return user;
  } catch (error) {
    console.error('Error buscando usuario por token de verificación:', error);
    throw new Error('Error al buscar usuario');
  }
};

/**
 * Helper para buscar un usuario por token de reset de password (matching .NET)
 * @param {string} token - Token de reset de password
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
export const findUserByPasswordResetToken = async (token) => {
  try {
    const user = await User.findOne({
      include: [
        {
          model: UserPasswordReset,
          as: 'UserPasswordReset',
          where: {
            PasswordResetToken: token,
            PasswordResetTokenExpiry: {
              [Op.gt]: new Date(), // Token no expirado
            },
            // Previene replay: un token ya usado no puede volver a canjearse
            // aunque siga dentro de su ventana de expiración.
            PasswordResetTokenUsedAt: null,
          },
        },
        {
          model: UserProfile,
          as: 'UserProfile',
        },
        {
          model: UserEmail,
          as: 'UserEmail',
        },
      ],
    });

    return user;
  } catch (error) {
    console.error('Error buscando usuario por token de reset:', error);
    throw new Error('Error al buscar usuario');
  }
};

export const updateUserPassword = async (userId, hashedPassword) => {
  const transaction = await User.sequelize.transaction();

  try {
    // Actualizar contraseña
    await User.update(
      {
        Password: hashedPassword,
      },
      {
        where: { Id: userId },
        transaction,
      }
    );

    // Marcar el token como usado (NO nulificarlo): así el endpoint de status
    // puede reportar 'used' en vez de perder el rastro del token.
    await UserPasswordReset.update(
      {
        PasswordResetTokenUsedAt: new Date(),
      },
      {
        where: { UserId: userId },
        transaction,
      }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error actualizando contraseña:', error);
    throw new Error('Error al actualizar contraseña');
  }
};

/**
 * Estado de un token de reset sin consumirlo, para polling desde clientes.
 * No filtra por expiry en el WHERE (a propósito) para poder distinguir
 * 'expired' de 'invalid' en JS.
 */
export const getPasswordResetTokenStatus = async (token) => {
  try {
    const row = await UserPasswordReset.findOne({
      where: { PasswordResetToken: token },
    });

    if (!row) return 'invalid';
    if (row.PasswordResetTokenUsedAt) return 'used';
    if (
      !row.PasswordResetTokenExpiry ||
      row.PasswordResetTokenExpiry.getTime() <= Date.now()
    ) {
      return 'expired';
    }
    return 'pending';
  } catch (error) {
    console.error('Error consultando estado de token de reset:', error);
    throw new Error('Error al consultar estado de token de reset');
  }
};
