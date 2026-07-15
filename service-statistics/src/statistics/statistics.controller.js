'use strict';

import { getLibrarySummary } from './statistics.service.js';

/**
 * GET /api/v1/summary
 *
 * Devuelve el resumen calculado a partir de los libros del Servicio Library,
 * con el formato común de éxito definido en docs/contracts.md.
 */
export const getSummary = async (req, res, next) => {
  try {
    const data = await getLibrarySummary();

    return res.status(200).json({
      success: true,
      message: 'Resumen generado correctamente',
      data,
    });
  } catch (error) {
    // Se delega al manejador de errores central (configs/app.js).
    next(error);
  }
};
