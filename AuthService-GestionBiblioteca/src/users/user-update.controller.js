import { asyncHandler } from '../../middlewares/server-genericError-handler.js';
import {
  approveUserUpdateRequest,
  listUserUpdateRequests,
  rejectUserUpdateRequest,
  requestUserUpdate,
} from '../../helpers/user-update-requests.js';
import { buildUserResponse } from '../../utils/user-helpers.js';

export const updateMyProfile = asyncHandler(async (req, res) => {
  const uploadedFile =
    req.file || req.files?.profilePicture?.[0] || req.files?.imagen?.[0];

  const input = {
    ...req.body,
    profilePicture: uploadedFile ? uploadedFile.path : req.body?.profilePicture,
  };

  const result = await requestUserUpdate({ user: req.user, input });

  if (result.status === 'pending') {
    return res.status(202).json({
      success: true,
      message: 'Solicitud enviada. Un administrador debe aprobar los cambios.',
      data: {
        id: result.request.Id,
        status: result.request.Status,
      },
    });
  }

  const response = {
    success: true,
    message: result.emailChanged
      ? 'Cambios aplicados. Verifica tu nuevo email.'
      : 'Cambios aplicados exitosamente.',
    data: buildUserResponse(result.user),
  };

  if (result.verificationToken) {
    response.data.emailVerificationToken = result.verificationToken;
  }

  return res.status(200).json(response);
});

export const listUpdateRequests = asyncHandler(async (req, res) => {
  const { status } = req.query || {};
  const requests = await listUserUpdateRequests({ status });
  return res.status(200).json({
    success: true,
    data: requests,
  });
});

export const approveUpdateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: approverId } = req;

  const { updatedUser, verificationToken } = await approveUserUpdateRequest(
    id,
    approverId
  );

  const response = {
    success: true,
    message: 'Solicitud aprobada. Cambios aplicados.',
    data: {
      user: buildUserResponse(updatedUser),
    },
  };

  if (verificationToken) {
    response.data.emailVerificationToken = verificationToken;
  }

  return res.status(200).json(response);
});

export const rejectUpdateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: approverId } = req;

  const request = await rejectUserUpdateRequest(id, approverId);

  return res.status(200).json({
    success: true,
    message: 'Solicitud rechazada.',
    data: {
      id: request.Id,
      status: request.Status,
    },
  });
});
