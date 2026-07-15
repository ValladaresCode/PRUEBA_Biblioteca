'use strict';

import mongoose from 'mongoose';

/**
 * Modelo Book (Libro) del Servicio Library - Sprint 1.
 *
 * Campos minimos definidos en docs/sprint-1.md:
 *  - title, author, category: strings obligatorios
 *  - year: numero entero obligatorio
 *  - available: boolean con valor por defecto true
 *
 * En este sprint NO se implementan prestamos ni CRUD completo, por lo que el
 * modelo se mantiene deliberadamente simple.
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El titulo es obligatorio'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'El autor es obligatorio'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'La categoria es obligatoria'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'El anio es obligatorio'],
      // Validacion simple para asegurar que sea un entero.
      validate: {
        validator: Number.isInteger,
        message: 'El anio debe ser un numero entero',
      },
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Book = mongoose.model('Book', bookSchema);
