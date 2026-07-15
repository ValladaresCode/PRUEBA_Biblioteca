import { asyncHandler } from '../../middlewares/server-genericError-handler.js';
import {
  approveSignupRequest,
  createSignupRequest,
  listSignupRequests,
  rejectSignupRequest,
  getSignupRequestByEmail,
} from '../../helpers/signup-request-db.js';
import { checkUserExists } from '../../helpers/user-db.js';

export const submitSignupRequest = asyncHandler(async (req, res) => {
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
  } = req.body || {};

  const uploadedFile =
    req.file || req.files?.profilePicture?.[0] || req.files?.imagen?.[0];

  const profilePicture = uploadedFile ? uploadedFile.path : null;

  const request = await createSignupRequest({
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
  });

  return res.status(201).json({
    success: true,
    message:
      'Solicitud creada. Un administrador debe aprobarla antes de que puedas verificar tu email.',
    data: {
      id: request.Id,
      status: request.Status,
      email: request.Email,
    },
  });
});

export const listPendingRequests = asyncHandler(async (req, res) => {
  const requests = await listSignupRequests({ status: 'PENDING' });
  return res.status(200).json({
    success: true,
    data: requests,
  });
});

export const approveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: approverId } = req;

  const { verificationToken } = await approveSignupRequest(id, approverId);

  return res.status(200).json({
    success: true,
    message:
      'Solicitud aprobada. Se envió un token de verificación al correo del solicitante.',
    data: {
      verificationToken,
    },
  });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: approverId } = req;

  const request = await rejectSignupRequest(id, approverId);

  return res.status(200).json({
    success: true,
    message: 'Solicitud rechazada.',
    data: {
      id: request.Id,
      status: request.Status,
    },
  });
});

export const checkRequestStatus = asyncHandler(async (req, res) => {
  const { email } = req.params;

  // Buscar en User table primero
  const userExists = await checkUserExists(email.toLowerCase());

  if (userExists) {
    return res.status(200).json({
      success: true,
      status: 'VERIFIED',
    });
  }

  // Si no es usuario, buscar en SignupRequest
  const request = await getSignupRequestByEmail(email.toLowerCase());

  if (request) {
    return res.status(200).json({
      success: true,
      status: request.Status, // PENDING, APPROVED, REJECTED
    });
  }

  return res.status(404).json({
    success: false,
    message: 'No se encontró solicitud',
  });
});
