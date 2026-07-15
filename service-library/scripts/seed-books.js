'use strict';

// Script de desarrollo idempotente para poblar la colección de libros.
// Uso: pnpm --filter service-library seed  (o: node scripts/seed-books.js)
//
// - Inserta libros de prueba solo si aún no existen (por título).
// - NO borra datos existentes.
// - Fechas de creación distintas para demostrar el orden de "últimos libros".

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Book } from '../src/books/book.model.js';

dotenv.config();

const day = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// createdAt/updatedAt explícitos (insertMany con timestamps:false) para tener
// fechas distintas y un orden predecible.
const SEED_BOOKS = [
  { title: 'Cien años de soledad', author: 'Gabriel García Márquez', category: 'Novela', year: 1967, available: true, createdAt: day(5), updatedAt: day(5) },
  { title: 'La sombra del viento', author: 'Carlos Ruiz Zafón', category: 'Novela', year: 2001, available: false, createdAt: day(4), updatedAt: day(4) },
  { title: 'Breve historia del tiempo', author: 'Stephen Hawking', category: 'Ciencia', year: 1988, available: true, createdAt: day(3), updatedAt: day(3) },
  { title: 'El origen de las especies', author: 'Charles Darwin', category: 'Ciencia', year: 1859, available: true, createdAt: day(2), updatedAt: day(2) },
  { title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Historia', year: 2011, available: false, createdAt: day(1), updatedAt: day(1) },
  { title: 'Clean Code', author: 'Robert C. Martin', category: 'Tecnología', year: 2008, available: true, createdAt: day(0), updatedAt: day(0) },
];

const run = async () => {
  const uri = process.env.URI_MONGO;
  if (!uri) {
    throw new Error('Falta la variable de entorno URI_MONGO');
  }

  await mongoose.connect(uri);
  console.log('Seed | Conectado a MongoDB');

  const existingTitles = new Set(
    (await Book.find({}, 'title').lean()).map((book) => book.title)
  );

  const toInsert = SEED_BOOKS.filter((book) => !existingTitles.has(book.title));

  if (toInsert.length === 0) {
    console.log('Seed | Todos los libros de prueba ya existen. Nada que insertar.');
  } else {
    await Book.insertMany(toInsert, { timestamps: false });
    console.log(`Seed | Insertados ${toInsert.length} libro(s):`);
    toInsert.forEach((book) => console.log(`  - ${book.title} (${book.category}, disponible=${book.available})`));
  }

  const total = await Book.countDocuments();
  console.log(`Seed | Total de libros en la colección: ${total}`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('Seed | Error:', error.message);
  try {
    await mongoose.connection.close();
  } catch {
    // Ignorar errores al cerrar.
  }
  process.exit(1);
});
