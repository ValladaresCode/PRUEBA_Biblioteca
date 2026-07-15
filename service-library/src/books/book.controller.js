'use strict';

import { Book } from './book.model.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getBooks = async (req, res, next) => {
  try {
    const { title, author, category } = req.query;
    const filter = {};

    if (title) filter.title = { $regex: escapeRegex(title), $options: 'i' };
    if (author) filter.author = { $regex: escapeRegex(author), $options: 'i' };
    if (category) filter.category = { $regex: escapeRegex(category), $options: 'i' };

    const items = await Book.find(filter).lean();

    return res.status(200).json({
      success: true,
      message: 'Libros obtenidos correctamente',
      data: { items, total: items.length },
    });
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req, res, next) => {
  try {
    const { title, author, category, year } = req.body;

    const book = await Book.create({ title, author, category, year, available: true });

    return res.status(201).json({
      success: true,
      message: 'Libro creado correctamente',
      data: book.toObject(),
    });
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {};
    const { title, author, category, year } = req.body;

    if (title !== undefined) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (category !== undefined) updateData.category = category;
    if (year !== undefined) updateData.year = year;

    const book = await Book.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Libro actualizado correctamente',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    let Loan;
    try {
      const loanModule = await import('../loans/loan.model.js');
      Loan = loanModule.Loan;
    } catch {
      // Loan model not yet implemented — skip active loan check
    }

    if (Loan) {
      const activeLoan = await Loan.findOne({ bookId: id, status: 'ACTIVE' }).lean();
      if (activeLoan) {
        return res.status(409).json({
          success: false,
          message: 'No se puede eliminar el libro porque tiene un prestamo activo',
        });
      }
    }

    const book = await Book.findByIdAndDelete(id).lean();

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Libro eliminado correctamente',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};
