import { Router } from 'express';
import {
  updateUserRole,
  getUserRoles,
  getUsersByRole,
} from './user.controller.js';
import {
  approveUpdateRequest,
  listUpdateRequests,
  rejectUpdateRequest,
  updateMyProfile,
} from './user-update.controller.js';

import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireAdmin } from '../../middlewares/require-admin.js';
import { upload, handleUploadError } from '../../helpers/file-upload.js';
import { validateUpdateUser } from '../../middlewares/validation.js';
import { User } from './user.model.js';
import { UserProfile, UserEmail } from './user.model.js';
import { UserRole, Role } from '../auth/role.model.js';
import { ADMIN_ROLE } from '../../helpers/role-constants.js';
import { buildUserResponse } from '../../utils/user-helpers.js';

const router = Router();

// PUT /api/v1/users/:userId/role
router.put('/:userId/role', ...updateUserRole);

// GET /api/v1/users/:userId/roles
router.get('/:userId/roles', ...getUserRoles);

// GET /api/v1/users/by-role/:roleName
router.get('/by-role/:roleName', ...getUsersByRole);

// PATCH /api/v1/users/me
router.patch(
  '/me',
  validateJWT,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'imagen', maxCount: 1 },
  ]),
  handleUploadError,
  validateUpdateUser,
  updateMyProfile
);

// GET /api/v1/users/update-requests
router.get('/update-requests', validateJWT, requireAdmin, listUpdateRequests);

// POST /api/v1/users/update-requests/:id/approve
router.post(
  '/update-requests/:id/approve',
  validateJWT,
  requireAdmin,
  approveUpdateRequest
);

// POST /api/v1/users/update-requests/:id/reject
router.post(
  '/update-requests/:id/reject',
  validateJWT,
  requireAdmin,
  rejectUpdateRequest
);

// GET /api/v1/users/all
router.get('/all', validateJWT, async (req, res) => {
  // Verificar que el usuario sea admin
  const user = req.user;
  const roles = user.UserRoles?.map((ur) => ur.Role?.Name) || [];
  if (!roles.includes(ADMIN_ROLE)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso restringido solo para administradores.',
    });
  }

  // Obtener todos los usuarios con relaciones
  const users = await User.findAll({
    include: [
      { model: UserProfile, as: 'UserProfile' },
      { model: UserEmail, as: 'UserEmail' },
      {
        model: UserRole,
        as: 'UserRoles',
        include: [{ model: Role, as: 'Role' }],
      },
    ],
  });

  // DTO SIEMPRE: los objetos Sequelize crudos exponen el hash de contraseña
  // y el token de verificación de email, y su shape difiere del resto de la API.
  return res
    .status(200)
    .json({ success: true, users: users.map(buildUserResponse) });
});

export default router;
