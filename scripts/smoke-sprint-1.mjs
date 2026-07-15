// Smoke test del Sprint 1 — solo APIs nativas de Node (fetch).
// Asume que los cuatro servicios ya están ejecutándose.
// Uso: node scripts/smoke-sprint-1.mjs  (o: pnpm smoke:sprint1)

const AUTH = process.env.AUTH_URL ?? 'http://localhost:4000';
const LIBRARY = process.env.LIBRARY_URL ?? 'http://localhost:4001';
const STATISTICS = process.env.STATISTICS_URL ?? 'http://localhost:4002';

let passed = 0;
let failed = 0;

const pass = (name) => {
  passed += 1;
  console.log(`PASS  ${name}`);
};

const fail = (name, detail) => {
  failed += 1;
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
};

const getJson = async (url, options) => {
  const res = await fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { res, body };
};

const run = async () => {
  // 1-3. Health checks de los tres servicios.
  for (const [name, base] of [
    ['Auth /health', AUTH],
    ['Library /health', LIBRARY],
    ['Statistics /health', STATISTICS],
  ]) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.status === 200) pass(name);
      else fail(name, `estado ${res.status}`);
    } catch (error) {
      fail(name, error.message);
    }
  }

  // 4. Registro con correo único.
  const email = `smoke_${Date.now()}@example.com`;
  const password = 'smoke12345';
  let registerBody = null;
  try {
    const { res, body } = await getJson(`${AUTH}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Test', email, password }),
    });
    registerBody = body;
    if (res.status === 201 && body?.success === true) pass('Auth registro (201)');
    else fail('Auth registro (201)', `estado ${res.status}`);
  } catch (error) {
    fail('Auth registro (201)', error.message);
  }

  // 5-7. Login + token + password ausente.
  let token = null;
  try {
    const { res, body } = await getJson(`${AUTH}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 200 && body?.success === true) pass('Auth login (200)');
    else fail('Auth login (200)', `estado ${res.status}`);

    token = body?.data?.token ?? null;
    if (typeof token === 'string' && token.length > 0) pass('Auth login devuelve data.token');
    else fail('Auth login devuelve data.token');

    const serialized = JSON.stringify(body ?? {});
    const registerSerialized = JSON.stringify(registerBody ?? {});
    if (!serialized.includes(password) && !registerSerialized.includes(password)) {
      pass('La contraseña no aparece en las respuestas');
    } else {
      fail('La contraseña no aparece en las respuestas');
    }
  } catch (error) {
    fail('Auth login (200)', error.message);
  }

  // 8-9. Library books + items array.
  try {
    const { res, body } = await getJson(`${LIBRARY}/api/v1/books`);
    if (res.status === 200 && body?.success === true) pass('Library GET /books (200)');
    else fail('Library GET /books (200)', `estado ${res.status}`);

    if (Array.isArray(body?.data?.items)) pass('Library data.items es un array');
    else fail('Library data.items es un array');
  } catch (error) {
    fail('Library GET /books (200)', error.message);
  }

  // 10-11. Statistics summary + campos.
  try {
    const { res, body } = await getJson(`${STATISTICS}/api/v1/summary`);
    if (res.status === 200 && body?.success === true) pass('Statistics GET /summary (200)');
    else fail('Statistics GET /summary (200)', `estado ${res.status}`);

    const data = body?.data ?? {};
    const requiredFields = ['totalBooks', 'availableBooks', 'categories', 'latestBooks'];
    const missing = requiredFields.filter((field) => !(field in data));
    if (missing.length === 0) pass('Statistics summary tiene todos los campos');
    else fail('Statistics summary tiene todos los campos', `faltan: ${missing.join(', ')}`);
  } catch (error) {
    fail('Statistics GET /summary (200)', error.message);
  }

  console.log(`\nResultado: ${passed} PASS, ${failed} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error('Error inesperado en el smoke test:', error.message);
  process.exit(1);
});
