'use strict';

import { Book } from './book.model.js';

/**
 * GET /api/v1/books
 *
 * Consulta los libros almacenados en MongoDB y los devuelve con el formato
 * comun de exito definido en docs/contracts.md. Una coleccion vacia es una
 * respuesta valida (items: [], total: 0).
 */
export const getBooks = async (req, res, next) => {
  try {
    // Consulta real a MongoDB. .lean() devuelve objetos JS planos (mas ligero).
    const items = await Book.find().lean();

    return res.status(200).json({
      success: true,
      message: 'Libros obtenidos correctamente',
      data: {
        items,
        total: items.length,
      },
    });
  } catch (error) {
    // Se delega al manejador de errores central (configs/app.js).
    next(error);
  }
};
