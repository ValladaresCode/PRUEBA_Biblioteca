import {
  getFullImageUrl,
  getDefaultAvatarPath,
} from '../helpers/cloudinary-service.js';

export const buildUserResponse = (user) => {
  // Obtener la URL de la imagen de perfil
  const profilePictureUrl =
    user.UserProfile && user.UserProfile.Imagen
      ? getFullImageUrl(user.UserProfile.Imagen)
      : getFullImageUrl(getDefaultAvatarPath());

  return {
    id: user.Id,
    name: user.Name,
    email: user.Email,
    phone:
      user.UserProfile && user.UserProfile.Phone ? user.UserProfile.Phone : '',
    profilePicture: profilePictureUrl,
    role: user.UserRoles?.[0]?.Role?.Name ?? 'USER_ROLE',
    isActive: user.IsActive,
    isEmailVerified: user.UserEmail ? user.UserEmail.EmailVerified : false,
    fechaNacimiento:
      user.UserProfile && user.UserProfile.FechaNacimiento
        ? user.UserProfile.FechaNacimiento
        : '',
    dpi: user.UserProfile && user.UserProfile.Dpi ? user.UserProfile.Dpi : '',
    ingresosMensuales:
      user.UserProfile && user.UserProfile.IngresosMensuales
        ? user.UserProfile.IngresosMensuales
        : '',
    direccion:
      user.UserProfile && user.UserProfile.Direccion
        ? user.UserProfile.Direccion
        : '',
    nombreTrabajo:
      user.UserProfile && user.UserProfile.NombreTrabajo
        ? user.UserProfile.NombreTrabajo
        : '',
    createdAt: user.CreatedAt,
    updatedAt: user.UpdatedAt,
  };
};
