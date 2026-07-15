import crypto from 'crypto';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../configs/config.js';
import fs from 'fs/promises';
import fsSync from 'fs';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Extensiones de imagen conocidas. Se usan para detectar public_ids legacy
// que quedaron guardados CON extensión (bug histórico: la extensión dentro
// del public_id hace que la URL de entrega la interprete como formato y dé 404).
const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|gif|jfif)$/i;

export const uploadImage = async (filePath, fileName) => {
  try {
    const folder = config.cloudinary.folder;
    // El public_id NUNCA debe llevar extensión: Cloudinary trata el último
    // ".xxx" de la URL de entrega como formato solicitado, no como parte del id.
    const publicId = fileName.replace(IMAGE_EXT_REGEX, '');
    const options = {
      public_id: publicId,
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    };

    const result = await cloudinary.uploader.upload(filePath, options);

    // Eliminar archivo local después de subir exitosamente
    try {
      await fs.unlink(filePath);
    } catch {
      console.warn('Warning: Could not delete local file:', filePath);
    }

    if (result.error) {
      throw new Error(`Error uploading image: ${result.error.message}`);
    }

    return publicId;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error?.message || error);

    try {
      await fs.unlink(filePath);
    } catch {
      console.warn('Warning: Could not delete local file after upload error');
    }

    throw new Error(
      `Failed to upload image to Cloudinary: ${error?.message || ''}`
    );
  }
};

export const deleteImage = async (imagePath) => {
  try {
    if (!imagePath || imagePath === config.cloudinary.defaultAvatarPath) {
      return true;
    }

    const folder = config.cloudinary.folder;
    const publicId = imagePath.includes('/')
      ? imagePath
      : `${folder}/${imagePath}`;
    const result = await cloudinary.uploader.destroy(publicId);

    return result.result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

export const getFullImageUrl = (imagePath) => {
  if (!imagePath) {
    return getDefaultAvatarUrl();
  }

  const baseUrl = config.cloudinary.baseUrl;
  const folder = config.cloudinary.folder;

  const pathToUse = imagePath.includes('/')
    ? imagePath
    : `${folder}/${imagePath}`;

  // Compatibilidad legacy: si el valor guardado termina en extensión, el
  // public_id real en Cloudinary la incluye (ej. "profile-x.jpeg"). La URL
  // debe repetir la extensión ("profile-x.jpeg.jpeg") para que Cloudinary
  // separe id y formato correctamente; si no, responde 404.
  const extMatch = pathToUse.match(IMAGE_EXT_REGEX);
  const finalPath = extMatch ? `${pathToUse}${extMatch[0]}` : pathToUse;

  return `${baseUrl}${finalPath}`;
};

export const getDefaultAvatarUrl = () => {
  const defaultPath = config.cloudinary.defaultAvatarPath;
  return getFullImageUrl(defaultPath);
};

export const getDefaultAvatarPath = () => {
  const defaultPath = config.cloudinary.defaultAvatarPath;
  // If dotenv didn't expand nested vars, build from env pieces
  if (defaultPath && defaultPath.includes('${')) {
    const folder = process.env.CLOUDINARY_FOLDER;
    const filename = process.env.CLOUDINARY_DEFAULT_AVATAR_FILENAME;
    if (folder || filename) {
      return [folder, filename].filter(Boolean).join('/');
    }
  }
  if (defaultPath && defaultPath.includes('/')) {
    return defaultPath.split('/').pop();
  }
  return defaultPath;
};

/**
 * Normaliza cualquier entrada de foto de perfil a un nombre de archivo limpio
 * listo para guardar en BD (sin folder, sin baseUrl, sin extensión).
 * - Path local (multer): sube a Cloudinary y devuelve el public_id corto.
 * - URL completa o path con folder: extrae el nombre.
 * Devuelve null si no hay imagen o si la subida falla.
 * Único punto de entrada para registro, solicitudes de signup y updates.
 */
export const resolveProfilePictureInput = async (profilePicture) => {
  if (!profilePicture || typeof profilePicture !== 'string') {
    return null;
  }

  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
    console.warn('Cloudinary config missing. Skipping profile image upload.');
    return null;
  }

  const uploadPath = config.upload.uploadPath;
  const isLocalFile =
    profilePicture.includes('uploads/') ||
    profilePicture.includes('uploads\\') ||
    profilePicture.includes(uploadPath) ||
    profilePicture.startsWith('./') ||
    fsSync.existsSync(profilePicture);

  if (isLocalFile) {
    const ext = path.extname(profilePicture);
    const randomHex = crypto.randomBytes(6).toString('hex');
    const cloudinaryFileName = `profile-${randomHex}${ext}`;
    try {
      return await uploadImage(profilePicture, cloudinaryFileName);
    } catch (error) {
      console.error(
        'Error uploading profile picture:',
        error?.message || error
      );
      return null;
    }
  }

  const baseUrl = config.cloudinary.baseUrl || '';
  const folder = config.cloudinary.folder || '';
  let normalized = profilePicture;
  if (baseUrl && normalized.startsWith(baseUrl)) {
    normalized = normalized.slice(baseUrl.length);
  }
  if (folder && normalized.startsWith(`${folder}/`)) {
    normalized = normalized.slice(folder.length + 1);
  }
  return normalized.split('/').pop();
};

export default {
  uploadImage,
  deleteImage,
  getFullImageUrl,
  getDefaultAvatarUrl,
  getDefaultAvatarPath,
  resolveProfilePictureInput,
};
