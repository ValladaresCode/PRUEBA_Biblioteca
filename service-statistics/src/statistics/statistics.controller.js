'use strict';

import { getLibrarySummary, getLibraryStatistics } from './statistics.service.js';

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

/**
 * GET /api/v1/statistics
 *
 * Devuelve las estadísticas reales calculadas a partir de los libros y préstamos
 * de Library. Reenvía el JWT en la petición.
 */
export const getStatistics = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const data = await getLibraryStatistics(authorization);

    return res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas correctamente',
      data,
    });
  } catch (error) {
    next(error);
  }
};
