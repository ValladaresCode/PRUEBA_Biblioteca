'use strict';

const ALLOWED_CREATE_FIELDS = ['title', 'author', 'category', 'year'];
const ALLOWED_UPDATE_FIELDS = ['title', 'author', 'category', 'year'];
const CURRENT_YEAR = new Date().getFullYear();

const buildErrors = (errors) =>
  errors.map(({ field, message, value }) => ({ field, message, value }));

const trimAndCheck = (value, fieldName) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (trimmed.length === 0) return { field: fieldName, message: `${fieldName} no puede estar vacio`, value };
  return null;
};

const stringCheck = (value, fieldName) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return { field: fieldName, message: `${fieldName} debe ser un texto`, value };
  const trimmed = value.trim();
  if (trimmed.length === 0) return { field: fieldName, message: `${fieldName} no puede estar vacio`, value };
  return null;
};

export const validateCreateBook = (req, res, next) => {
  const errors = [];

  if (!req.body.title) {
    errors.push({ field: 'title', message: 'El titulo es obligatorio', value: req.body.title });
  } else {
    const err = stringCheck(req.body.title, 'title');
    if (err) errors.push(err);
  }

  if (!req.body.author) {
    errors.push({ field: 'author', message: 'El autor es obligatorio', value: req.body.author });
  } else {
    const err = stringCheck(req.body.author, 'author');
    if (err) errors.push(err);
  }

  if (!req.body.category) {
    errors.push({ field: 'category', message: 'La categoria es obligatoria', value: req.body.category });
  } else {
    const err = stringCheck(req.body.category, 'category');
    if (err) errors.push(err);
  }

  if (req.body.year === undefined || req.body.year === null) {
    errors.push({ field: 'year', message: 'El anio es obligatorio', value: req.body.year });
  } else {
    const year = Number(req.body.year);
    if (!Number.isInteger(year)) {
      errors.push({ field: 'year', message: 'El anio debe ser un numero entero', value: req.body.year });
    } else if (year < 1000 || year > CURRENT_YEAR) {
      errors.push({ field: 'year', message: `El anio debe estar entre 1000 y ${CURRENT_YEAR}`, value: req.body.year });
    }
  }

  if ('available' in req.body) {
    errors.push({ field: 'available', message: 'No se permite asignar disponible manualmente', value: req.body.available });
  }

  const extraFields = Object.keys(req.body).filter(k => !ALLOWED_CREATE_FIELDS.includes(k));
  if (extraFields.length > 0) {
    extraFields.forEach(f => {
      errors.push({ field: f, message: `El campo ${f} no esta permitido`, value: req.body[f] });
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validacion',
      errors: buildErrors(errors),
    });
  }

  req.body.title = String(req.body.title).trim();
  req.body.author = String(req.body.author).trim();
  req.body.category = String(req.body.category).trim();
  req.body.year = Number(req.body.year);

  next();
};

export const validateUpdateBook = (req, res, next) => {
  const errors = [];

  if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    errors.push({ field: 'id', message: 'ID de libro invalido', value: req.params.id });
  }

  if ('title' in req.body) {
    const err = stringCheck(req.body.title, 'title');
    if (err) errors.push(err);
  }

  if ('author' in req.body) {
    const err = stringCheck(req.body.author, 'author');
    if (err) errors.push(err);
  }

  if ('category' in req.body) {
    const err = stringCheck(req.body.category, 'category');
    if (err) errors.push(err);
  }

  if ('year' in req.body) {
    const year = Number(req.body.year);
    if (!Number.isInteger(year)) {
      errors.push({ field: 'year', message: 'El anio debe ser un numero entero', value: req.body.year });
    } else if (year < 1000 || year > CURRENT_YEAR) {
      errors.push({ field: 'year', message: `El anio debe estar entre 1000 y ${CURRENT_YEAR}`, value: req.body.year });
    }
  }

  if ('available' in req.body) {
    errors.push({ field: 'available', message: 'No se permite modificar disponible manualmente', value: req.body.available });
  }

  const extraFields = Object.keys(req.body).filter(k => !ALLOWED_UPDATE_FIELDS.includes(k));
  if (extraFields.length > 0) {
    extraFields.forEach(f => {
      errors.push({ field: f, message: `El campo ${f} no esta permitido`, value: req.body[f] });
    });
  }

  if (Object.keys(req.body).length === 0) {
    errors.push({ field: 'body', message: 'El cuerpo de la solicitud no puede estar vacio', value: null });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validacion',
      errors: buildErrors(errors),
    });
  }

  if (req.body.title) req.body.title = String(req.body.title).trim();
  if (req.body.author) req.body.author = String(req.body.author).trim();
  if (req.body.category) req.body.category = String(req.body.category).trim();
  if (req.body.year !== undefined) req.body.year = Number(req.body.year);

  next();
};

export const validateBookId = (req, res, next) => {
  if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'ID de libro invalido',
      errors: [{ field: 'id', message: 'ID de libro invalido', value: req.params.id }],
    });
  }
  next();
};

export const validateBookQuery = (req, res, next) => {
  if (req.query.title && typeof req.query.title !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Filtro title invalido',
      errors: [{ field: 'title', message: 'El filtro title debe ser texto', value: req.query.title }],
    });
  }
  if (req.query.author && typeof req.query.author !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Filtro author invalido',
      errors: [{ field: 'author', message: 'El filtro author debe ser texto', value: req.query.author }],
    });
  }
  if (req.query.category && typeof req.query.category !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Filtro category invalido',
      errors: [{ field: 'category', message: 'El filtro category debe ser texto', value: req.query.category }],
    });
  }
  next();
};
