'use strict';

import mongoose from 'mongoose';

/**
 * Modelo Loan (Préstamo) del Servicio Library — Sprint 2 (S2-03).
 *
 * Campos según docs/sprint-2.md y contrato de la tarea:
 *  - bookId: ObjectId ref Book, requerido, indexado
 *  - borrowerName: string requerida y trim
 *  - dueDate: Date requerida
 *  - loanDate: Date default Date.now
 *  - returnedAt: Date default null
 *  - status: ACTIVE | RETURNED, default ACTIVE
 *  - createdBy: string (sub del JWT), requerida
 *
 * Índice único parcial sobre bookId cuando status === 'ACTIVE'
 * para impedir doble préstamo activo del mismo libro a nivel de BD.
 */
const loanSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'El bookId es obligatorio'],
      index: true,
    },
    borrowerName: {
      type: String,
      required: [true, 'El nombre del prestatario es obligatorio'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'La fecha de devolución es obligatoria'],
    },
    loanDate: {
      type: Date,
      default: Date.now,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'RETURNED'],
        message: 'El status debe ser ACTIVE o RETURNED',
      },
      default: 'ACTIVE',
    },
    createdBy: {
      type: String,
      required: [true, 'createdBy es obligatorio'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Un solo préstamo ACTIVE por libro (concurrencia + consistencia).
loanSchema.index(
  { bookId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
    name: 'unique_active_loan_per_book',
  }
);

export const Loan = mongoose.model('Loan', loanSchema);
