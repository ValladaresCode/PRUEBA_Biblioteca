import { SignupRequest } from '../src/auth/signup-request.model.js';
import { checkUserExists, checkDpiExists } from './user-db.js';
import { hashPassword } from '../utils/password-utils.js';
import { generateEmailVerificationToken } from '../utils/auth-helpers.js';
import { sendVerificationEmail } from './email-service.js';
import { resolveProfilePictureInput } from './cloudinary-service.js';
import { Op } from 'sequelize';

export const createSignupRequest = async ({
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
}) => {
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail =
    typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedPassword = typeof password === 'string' ? password : '';
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
  const normalizedFechaNacimiento =
    typeof fechaNacimiento === 'string'
      ? fechaNacimiento.trim()
      : fechaNacimiento;
  const normalizedDpi =
    typeof dpi === 'string' ? dpi.trim() : dpi ? String(dpi).trim() : '';
  const normalizedDireccion =
    typeof direccion === 'string' ? direccion.trim() : '';
  const normalizedNombreTrabajo =
    typeof nombreTrabajo === 'string' ? nombreTrabajo.trim() : '';

  const normalizedIngresosMensuales =
    ingresosMensuales === undefined ||
    ingresosMensuales === null ||
    ingresosMensuales === ''
      ? null
      : Number(ingresosMensuales);

  if (
    !normalizedName ||
    !normalizedEmail ||
    !normalizedPassword ||
    !normalizedPhone
  ) {
    const err = new Error('Faltan campos obligatorios para crear la solicitud');
    err.status = 400;
    throw err;
  }

  if (
    normalizedIngresosMensuales !== null &&
    Number.isNaN(normalizedIngresosMensuales)
  ) {
    const err = new Error('Los ingresos mensuales deben ser un número válido');
    err.status = 400;
    throw err;
  }

  if (await checkUserExists(normalizedEmail)) {
    const err = new Error('Ya existe un usuario con este email');
    err.status = 409;
    throw err;
  }

  const existingPending = await SignupRequest.findOne({
    where: { Email: normalizedEmail, Status: 'PENDING' },
  });
  if (existingPending) {
    const err = new Error('Ya existe una solicitud pendiente para este email');
    err.status = 409;
    throw err;
  }

  if (normalizedDpi) {
    // Contra usuarios ya existentes: user_profiles.dpi es UNIQUE y la colisión
    // detectada recién al verificar el email deja la solicitud varada.
    if (await checkDpiExists(normalizedDpi)) {
      const err = new Error('El DPI ya está registrado por otro usuario');
      err.status = 409;
      throw err;
    }

    const existingByDpi = await SignupRequest.findOne({
      where: { Dpi: normalizedDpi },
    });
    if (existingByDpi && existingByDpi.Email !== normalizedEmail) {
      const err = new Error('El DPI ya está registrado en otra solicitud');
      err.status = 409;
      throw err;
    }
  }

  const passwordHash = await hashPassword(normalizedPassword);

  // Subir la foto a Cloudinary AHORA (no al aprobar): el path local de multer
  // no sobrevive redeploys y la aprobación puede tardar días. Se guarda el
  // nombre limpio del asset, igual que en el registro directo.
  const resolvedProfilePicture =
    await resolveProfilePictureInput(profilePicture);

  // If there is an existing signup request for this email that was rejected,
  // allow reusing it by updating its data and marking it as PENDING again.
  const existingAny = await SignupRequest.findOne({
    where: { Email: normalizedEmail },
  });
  if (existingAny) {
    if (existingAny.Status === 'REJECTED') {
      existingAny.Name = normalizedName;
      existingAny.PasswordHash = passwordHash;
      existingAny.Phone = normalizedPhone;
      existingAny.FechaNacimiento = normalizedFechaNacimiento;
      existingAny.Dpi = normalizedDpi || null;
      existingAny.IngresosMensuales = normalizedIngresosMensuales;
      existingAny.Direccion = normalizedDireccion || null;
      existingAny.NombreTrabajo = normalizedNombreTrabajo || null;
      existingAny.ProfilePicture = resolvedProfilePicture || null;
      existingAny.Status = 'PENDING';
      existingAny.ApprovedBy = null;
      existingAny.ApprovedAt = null;
      existingAny.VerificationToken = null;
      existingAny.VerificationTokenExpiry = null;
      await existingAny.save();
      return existingAny;
    }
    // If it's APPROVED or other state, creation will fail due to unique constraint
    // but we intentionally fall through to throw a friendly error instead of
    // hitting a DB unique constraint exception.
    const err = new Error('Ya existe una solicitud para este email');
    err.status = 409;
    throw err;
  }

  const request = await SignupRequest.create({
    Name: normalizedName,
    Email: normalizedEmail,
    PasswordHash: passwordHash,
    Phone: normalizedPhone,
    FechaNacimiento: normalizedFechaNacimiento,
    Dpi: normalizedDpi || null,
    IngresosMensuales: normalizedIngresosMensuales,
    Direccion: normalizedDireccion || null,
    NombreTrabajo: normalizedNombreTrabajo || null,
    ProfilePicture: resolvedProfilePicture || null,
    Status: 'PENDING',
  });

  return request;
};

export const listSignupRequests = async ({ status = 'PENDING' } = {}) => {
  const whereClause = status ? { Status: status } : {};
  return SignupRequest.findAll({
    where: whereClause,
    order: [['created_at', 'ASC']],
    attributes: { exclude: ['PasswordHash'] },
  });
};

export const getSignupRequestByEmail = async (email) => {
  return SignupRequest.findOne({
    where: { Email: email },
  });
};

export const getSignupRequestById = async (id) => {
  return SignupRequest.findByPk(id);
};

export const approveSignupRequest = async (id, approverId) => {
  const request = await SignupRequest.findByPk(id);
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

  if (await checkUserExists(request.Email)) {
    const err = new Error('Ya existe un usuario con este email');
    err.status = 409;
    throw err;
  }

  // Mismo re-chequeo que el email: entre el submit y la aprobación pudo
  // crearse un usuario con este DPI; mejor rechazar aquí que dejar la
  // solicitud aprobada y varada cuando el usuario haga clic en el enlace.
  if (request.Dpi && (await checkDpiExists(request.Dpi))) {
    const err = new Error('El DPI ya está registrado por otro usuario');
    err.status = 409;
    throw err;
  }

  // Generar token de verificación sobre la solicitud aprobada.
  const verificationToken = await generateEmailVerificationToken();
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Marcar la solicitud como aprobada
  request.Status = 'APPROVED';
  request.ApprovedBy = approverId || null;
  request.ApprovedAt = new Date();
  request.VerificationToken = verificationToken;
  request.VerificationTokenExpiry = tokenExpiry;
  await request.save();

  // Enviar email con el token de verificación
  try {
    await sendVerificationEmail(request.Email, request.Name, verificationToken);
  } catch (err) {
    // No romper el flujo si el correo falla; el token sigue siendo válido
    console.error(
      'Error enviando email de verificación tras aprobar solicitud:',
      err
    );
  }

  return { request, verificationToken };
};

export const findApprovedSignupRequestByVerificationToken = async (token) => {
  return SignupRequest.findOne({
    where: {
      Status: 'APPROVED',
      VerificationToken: token,
      VerificationTokenExpiry: {
        [Op.gt]: new Date(),
      },
    },
  });
};

export const consumeSignupRequestVerificationToken = async (requestId) => {
  await SignupRequest.update(
    {
      VerificationToken: null,
      VerificationTokenExpiry: null,
    },
    {
      where: { Id: requestId },
    }
  );
};

export const rejectSignupRequest = async (id, approverId) => {
  const request = await SignupRequest.findByPk(id);
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
