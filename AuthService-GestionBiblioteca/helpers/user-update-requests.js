import { Op } from 'sequelize';
import { resolveProfilePictureInput } from './cloudinary-service.js';
import { UserUpdateRequest } from '../src/users/user-update-request.model.js';
import {
  User,
  UserEmail,
  UserPasswordReset,
  UserProfile,
} from '../src/users/user.model.js';
import { findUserById } from './user-db.js';
import { generateEmailVerificationToken } from '../utils/auth-helpers.js';
import { hashPassword, verifyPassword } from '../utils/password-utils.js';
import { sendVerificationEmail } from './email-service.js';

const SENSITIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

const isEmailTaken = async (email, userId) => {
  const existing = await User.findOne({
    where: {
      Email: email.toLowerCase(),
      Id: { [Op.ne]: userId },
    },
  });
  return !!existing;
};

const applyUserUpdates = async ({
  userId,
  name,
  email,
  phone,
  ingresosMensuales,
  direccion,
  nombreTrabajo,
  passwordHash,
  profilePicture,
  sensitiveChanged,
}) => {
  const now = new Date();
  let verificationToken = null;
  let verificationEmail = null;

  const transaction = await User.sequelize.transaction();
  try {
    const userUpdates = {};
    if (name) {
      userUpdates.Name = name;
    }
    if (email) {
      userUpdates.Email = email.toLowerCase();
    }
    if (passwordHash) {
      userUpdates.Password = passwordHash;
    }
    if (sensitiveChanged) {
      userUpdates.LastSensitiveChangeAt = now;
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.update(userUpdates, {
        where: { Id: userId },
        transaction,
      });
    }

    const profileUpdates = {};
    if (phone) {
      profileUpdates.Phone = phone;
    }
    if (ingresosMensuales !== undefined && ingresosMensuales !== null) {
      profileUpdates.IngresosMensuales = ingresosMensuales;
    }
    if (direccion !== undefined && direccion !== null) {
      profileUpdates.Direccion = direccion;
    }
    if (nombreTrabajo !== undefined && nombreTrabajo !== null) {
      profileUpdates.NombreTrabajo = nombreTrabajo;
    }
    if (profilePicture) {
      profileUpdates.Imagen = profilePicture;
    }
    if (Object.keys(profileUpdates).length > 0) {
      await UserProfile.update(profileUpdates, {
        where: { UserId: userId },
        transaction,
      });
    }

    if (passwordHash) {
      await UserPasswordReset.update(
        {
          PasswordResetToken: null,
          PasswordResetTokenExpiry: null,
        },
        {
          where: { UserId: userId },
          transaction,
        }
      );
    }

    if (email) {
      verificationToken = await generateEmailVerificationToken();
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await UserEmail.update(
        {
          EmailVerified: false,
          EmailVerificationToken: verificationToken,
          EmailVerificationTokenExpiry: tokenExpiry,
        },
        {
          where: { UserId: userId },
          transaction,
        }
      );
      verificationEmail = email.toLowerCase();
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const updatedUser = await findUserById(userId);

  if (verificationEmail && verificationToken) {
    try {
      await sendVerificationEmail(
        verificationEmail,
        updatedUser.Name,
        verificationToken
      );
    } catch (err) {
      console.error('Error enviando email de verificacion:', err);
    }
  }

  return { updatedUser, verificationToken };
};

export const requestUserUpdate = async ({ user, input }) => {
  const nameRaw = (input.name || '').trim();
  const name = nameRaw ? nameRaw : null;
  const emailRaw = (input.email || '').trim();
  const email = emailRaw ? emailRaw.toLowerCase() : null;
  const phone = (input.phone || '').trim();
  const ingresosMensuales =
    input.ingresosMensuales !== undefined ? input.ingresosMensuales : null;
  const direccion = input.direccion !== undefined ? input.direccion : null;
  const nombreTrabajo =
    input.nombreTrabajo !== undefined ? input.nombreTrabajo : null;
  const newPassword = input.newPassword || null;
  const currentPassword = input.currentPassword || null;
  const profilePictureInput = input.profilePicture || null;

  const currentName = user.Name || '';
  const currentEmail = (user.Email || '').toLowerCase();
  const currentPhone = user.UserProfile?.Phone || '';
  const currentIngresosMensuales = user.UserProfile?.IngresosMensuales;
  const currentDireccion = user.UserProfile?.Direccion || '';
  const currentNombreTrabajo = user.UserProfile?.NombreTrabajo || '';

  const nameChanged = name && name !== currentName;
  const emailChanged = email && email !== currentEmail;
  const phoneChanged = phone && phone !== currentPhone;
  const ingresosMensualesChanged =
    ingresosMensuales !== null &&
    Number(ingresosMensuales) !== Number(currentIngresosMensuales);
  const direccionChanged = direccion !== null && direccion !== currentDireccion;
  const nombreTrabajoChanged =
    nombreTrabajo !== null && nombreTrabajo !== currentNombreTrabajo;
  const passwordChanged = !!newPassword;
  const profilePictureChanged = !!profilePictureInput;

  if (
    !emailChanged &&
    !phoneChanged &&
    !passwordChanged &&
    !profilePictureChanged &&
    !ingresosMensualesChanged &&
    !nameChanged &&
    !direccionChanged &&
    !nombreTrabajoChanged
  ) {
    const err = new Error('No hay cambios para actualizar');
    err.status = 400;
    throw err;
  }

  if (passwordChanged) {
    const isValid = await verifyPassword(user.Password, currentPassword || '');
    if (!isValid) {
      const err = new Error('La contrasena actual es incorrecta');
      err.status = 401;
      throw err;
    }
  }

  if (emailChanged && (await isEmailTaken(email, user.Id))) {
    const err = new Error('Ya existe un usuario con este email');
    err.status = 409;
    throw err;
  }

  const sensitiveCount = [emailChanged, phoneChanged, passwordChanged].filter(
    Boolean
  ).length;
  const lastSensitiveAt = user.LastSensitiveChangeAt
    ? new Date(user.LastSensitiveChangeAt).getTime()
    : null;
  const recentSensitiveChange =
    lastSensitiveAt && Date.now() - lastSensitiveAt < SENSITIVE_WINDOW_MS;
  const requiresAdmin =
    sensitiveCount >= 2 || (sensitiveCount >= 1 && recentSensitiveChange);

  const pendingRequest = await UserUpdateRequest.findOne({
    where: { UserId: user.Id, Status: 'PENDING' },
  });
  if (pendingRequest && (requiresAdmin || sensitiveCount > 0)) {
    const err = new Error('Ya tienes una solicitud pendiente de aprobacion');
    err.status = 409;
    throw err;
  }

  const profilePicture = profilePictureChanged
    ? await resolveProfilePictureInput(profilePictureInput)
    : null;
  const passwordHash = passwordChanged ? await hashPassword(newPassword) : null;

  if (requiresAdmin) {
    const request = await UserUpdateRequest.create({
      UserId: user.Id,
      Name: nameChanged ? name : null,
      Email: emailChanged ? email : null,
      Phone: phoneChanged ? phone : null,
      IngresosMensuales: ingresosMensualesChanged ? ingresosMensuales : null,
      Direccion: direccionChanged ? direccion : null,
      NombreTrabajo: nombreTrabajoChanged ? nombreTrabajo : null,
      PasswordHash: passwordChanged ? passwordHash : null,
      ProfilePicture: profilePictureChanged ? profilePicture : null,
      Status: 'PENDING',
    });

    return {
      status: 'pending',
      request,
    };
  }

  const sensitiveChanged = sensitiveCount > 0;
  const { updatedUser, verificationToken } = await applyUserUpdates({
    userId: user.Id,
    name: nameChanged ? name : null,
    email: emailChanged ? email : null,
    phone: phoneChanged ? phone : null,
    ingresosMensuales: ingresosMensualesChanged ? ingresosMensuales : null,
    direccion: direccionChanged ? direccion : null,
    nombreTrabajo: nombreTrabajoChanged ? nombreTrabajo : null,
    passwordHash: passwordChanged ? passwordHash : null,
    profilePicture: profilePictureChanged ? profilePicture : null,
    sensitiveChanged,
  });

  return {
    status: 'applied',
    user: updatedUser,
    verificationToken,
    emailChanged,
  };
};

export const listUserUpdateRequests = async ({ status } = {}) => {
  const normalizedStatus = status ? status.toUpperCase() : null;
  const whereClause = normalizedStatus ? { Status: normalizedStatus } : {};
  return UserUpdateRequest.findAll({
    where: whereClause,
    order: [['created_at', 'ASC']],
    attributes: { exclude: ['PasswordHash'] },
  });
};

export const approveUserUpdateRequest = async (id, approverId) => {
  const request = await UserUpdateRequest.findByPk(id);
  if (!request) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }

  if (request.Status !== 'PENDING') {
    const err = new Error('La solicitud ya fue procesada');
    err.status = 400;
    throw err;
  }

  const user = await findUserById(request.UserId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  const email = request.Email ? request.Email.toLowerCase() : null;
  if (email && (await isEmailTaken(email, request.UserId))) {
    const err = new Error('Ya existe un usuario con este email');
    err.status = 409;
    throw err;
  }

  const sensitiveChanged =
    !!request.Email || !!request.Phone || !!request.PasswordHash;

  const { updatedUser, verificationToken } = await applyUserUpdates({
    userId: request.UserId,
    name: request.Name ? request.Name : null,
    email: request.Email ? request.Email : null,
    phone: request.Phone ? request.Phone : null,
    ingresosMensuales:
      request.IngresosMensuales !== undefined &&
      request.IngresosMensuales !== null
        ? request.IngresosMensuales
        : null,
    direccion: request.Direccion ? request.Direccion : null,
    nombreTrabajo: request.NombreTrabajo ? request.NombreTrabajo : null,
    passwordHash: request.PasswordHash ? request.PasswordHash : null,
    profilePicture: request.ProfilePicture ? request.ProfilePicture : null,
    sensitiveChanged,
  });

  request.Status = 'APPROVED';
  request.ApprovedBy = approverId || null;
  request.ApprovedAt = new Date();
  await request.save();

  return { updatedUser, verificationToken, request };
};

export const rejectUserUpdateRequest = async (id, approverId) => {
  const request = await UserUpdateRequest.findByPk(id);
  if (!request) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }

  if (request.Status !== 'PENDING') {
    const err = new Error('La solicitud ya fue procesada');
    err.status = 400;
    throw err;
  }

  request.Status = 'REJECTED';
  request.ApprovedBy = approverId || null;
  request.ApprovedAt = new Date();
  await request.save();
  return request;
};
