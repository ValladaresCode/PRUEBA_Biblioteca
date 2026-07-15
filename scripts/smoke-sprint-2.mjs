// Smoke test del Sprint 2 — solo APIs nativas de Node (fetch).
// Ejercita el flujo real de extremo a extremo contra los servicios reales
// (Auth + PostgreSQL, Library + MongoDB, Statistics). NO usa mocks.
//
// Requisitos: los tres servicios backend deben estar ejecutandose con
// infraestructura real (PostgreSQL para Auth, MongoDB para Library) y las
// mismas variables JWT_SECRET / JWT_ISSUER / JWT_AUDIENCE en los tres.
//
// Uso: node scripts/smoke-sprint-2.mjs   (o: pnpm smoke:sprint2)
//
// Variable opcional para la comprobacion 21 (503 con Library caido):
//   SMOKE_STATS_LIBDOWN_URL=http://localhost:4102
//   Debe apuntar a una instancia de Statistics configurada con un Library
//   inalcanzable. Si no se define, la comprobacion 21 se marca como SKIP.

const AUTH = process.env.AUTH_URL ?? 'http://localhost:4000';
const LIBRARY = process.env.LIBRARY_URL ?? 'http://localhost:4001';
const STATISTICS = process.env.STATISTICS_URL ?? 'http://localhost:4002';
const STATS_LIBDOWN = process.env.SMOKE_STATS_LIBDOWN_URL ?? null;

let passed = 0;
let failed = 0;
let skipped = 0;

const pass = (name) => {
  passed += 1;
  console.log(`PASS  ${name}`);
};

const fail = (name, detail) => {
  failed += 1;
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
};

const skip = (name, detail) => {
  skipped += 1;
  console.log(`SKIP  ${name}${detail ? ` — ${detail}` : ''}`);
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

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const run = async () => {
  // 1-3. Health de los tres servicios.
  for (const [name, base] of [
    ['1. Health Auth', AUTH],
    ['2. Health Library', LIBRARY],
    ['3. Health Statistics', STATISTICS],
  ]) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.status === 200) pass(name);
      else fail(name, `estado ${res.status}`);
    } catch (error) {
      fail(name, error.message);
    }
  }

  // 4. Registrar usuario unico.
  const email = `smoke2_${Date.now()}@example.com`;
  const password = 'smoke12345';
  try {
    const { res, body } = await getJson(`${AUTH}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Sprint2', email, password }),
    });
    if (res.status === 201 && body?.success === true) pass('4. Registrar usuario unico (201)');
    else fail('4. Registrar usuario unico (201)', `estado ${res.status}`);
  } catch (error) {
    fail('4. Registrar usuario unico (201)', error.message);
  }

  // 5-6. Login y obtencion del JWT.
  let token = null;
  try {
    const { res, body } = await getJson(`${AUTH}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 200 && body?.success === true) pass('5. Login (200)');
    else fail('5. Login (200)', `estado ${res.status}`);

    token = body?.data?.token ?? null;
    if (typeof token === 'string' && token.length > 0) pass('6. Obtener JWT');
    else fail('6. Obtener JWT');
  } catch (error) {
    fail('5. Login (200)', error.message);
  }

  if (!token) {
    console.log('\nNo se obtuvo JWT; se aborta el resto del flujo protegido.');
    console.log(`\nResultado: ${passed} PASS, ${failed} FAIL, ${skipped} SKIP`);
    process.exit(1);
  }

  // Estadisticas base (para verificar el incremento de activeLoans mas adelante).
  let baseActiveLoans = null;
  try {
    const { res, body } = await getJson(`${STATISTICS}/api/v1/statistics`, {
      headers: authHeaders(token),
    });
    if (res.status === 200 && isNumber(body?.data?.activeLoans)) {
      baseActiveLoans = body.data.activeLoans;
    }
  } catch {
    // Se reintenta la lectura completa en el paso 15.
  }

  // 7. POST /books sin JWT devuelve 401.
  try {
    const { res } = await getJson(`${LIBRARY}/api/v1/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'X', author: 'Y', category: 'Z', year: 2000 }),
    });
    if (res.status === 401) pass('7. POST /books sin JWT devuelve 401');
    else fail('7. POST /books sin JWT devuelve 401', `estado ${res.status}`);
  } catch (error) {
    fail('7. POST /books sin JWT devuelve 401', error.message);
  }

  // 8. Crear Book con JWT devuelve 201.
  let bookId = null;
  const uniqueTitle = `Smoke Book ${Date.now()}`;
  try {
    const { res, body } = await getJson(`${LIBRARY}/api/v1/books`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        title: uniqueTitle,
        author: 'Autor Smoke',
        category: 'Pruebas',
        year: 2020,
      }),
    });
    bookId = body?.data?._id ?? null;
    if (res.status === 201 && body?.success === true && bookId) pass('8. Crear Book con JWT (201)');
    else fail('8. Crear Book con JWT (201)', `estado ${res.status}`);
  } catch (error) {
    fail('8. Crear Book con JWT (201)', error.message);
  }

  if (!bookId) {
    console.log('\nNo se pudo crear el Book; se aborta el resto del flujo.');
    console.log(`\nResultado: ${passed} PASS, ${failed} FAIL, ${skipped} SKIP`);
    process.exit(1);
  }

  // 9. Editar Book devuelve 200.
  try {
    const { res, body } = await getJson(`${LIBRARY}/api/v1/books/${bookId}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ category: 'Pruebas-Editado' }),
    });
    if (res.status === 200 && body?.data?.category === 'Pruebas-Editado') pass('9. Editar Book (200)');
    else fail('9. Editar Book (200)', `estado ${res.status}`);
  } catch (error) {
    fail('9. Editar Book (200)', error.message);
  }

  // 10. GET /books contiene el Book.
  try {
    const { res, body } = await getJson(`${LIBRARY}/api/v1/books`);
    const items = body?.data?.items ?? [];
    const found = items.find((b) => b._id === bookId);
    if (res.status === 200 && found) pass('10. GET /books contiene el Book');
    else fail('10. GET /books contiene el Book', `estado ${res.status}`);
  } catch (error) {
    fail('10. GET /books contiene el Book', error.message);
  }

  // 11. Crear Loan devuelve 201.
  let loanId = null;
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const { res, body } = await getJson(`${LIBRARY}/api/v1/loans`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ bookId, borrowerName: 'Prestatario Smoke', dueDate }),
    });
    loanId = body?.data?.loan?._id ?? null;
    if (res.status === 201 && body?.data?.loan?.status === 'ACTIVE' && loanId) pass('11. Crear Loan (201)');
    else fail('11. Crear Loan (201)', `estado ${res.status}`);
  } catch (error) {
    fail('11. Crear Loan (201)', error.message);
  }

  // 12. Book queda available=false.
  try {
    const { body } = await getJson(`${LIBRARY}/api/v1/books`);
    const found = (body?.data?.items ?? []).find((b) => b._id === bookId);
    if (found && found.available === false) pass('12. Book queda available=false');
    else fail('12. Book queda available=false', `available=${found?.available}`);
  } catch (error) {
    fail('12. Book queda available=false', error.message);
  }

  // 13. Doble Loan devuelve 409.
  try {
    const { res } = await getJson(`${LIBRARY}/api/v1/loans`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ bookId, borrowerName: 'Otro Prestatario', dueDate }),
    });
    if (res.status === 409) pass('13. Doble Loan devuelve 409');
    else fail('13. Doble Loan devuelve 409', `estado ${res.status}`);
  } catch (error) {
    fail('13. Doble Loan devuelve 409', error.message);
  }

  // 14. GET /loans contiene Loan ACTIVE.
  try {
    const { res, body } = await getJson(`${LIBRARY}/api/v1/loans?status=ACTIVE`, {
      headers: authHeaders(token),
    });
    const items = body?.data?.items ?? [];
    const found = items.find((l) => l._id === loanId && l.status === 'ACTIVE');
    if (res.status === 200 && found) pass('14. GET /loans contiene Loan ACTIVE');
    else fail('14. GET /loans contiene Loan ACTIVE', `estado ${res.status}`);
  } catch (error) {
    fail('14. GET /loans contiene Loan ACTIVE', error.message);
  }

  // 15. GET /statistics devuelve metricas numericas.
  let activeAfterLoan = null;
  try {
    const { res, body } = await getJson(`${STATISTICS}/api/v1/statistics`, {
      headers: authHeaders(token),
    });
    const data = body?.data ?? {};
    const fields = ['totalBooks', 'availableBooks', 'totalLoans', 'activeLoans', 'returnedLoans'];
    const allNumeric = fields.every((f) => isNumber(data[f]));
    activeAfterLoan = data.activeLoans;
    if (res.status === 200 && allNumeric) pass('15. GET /statistics devuelve metricas numericas');
    else fail('15. GET /statistics devuelve metricas numericas', `estado ${res.status}`);
  } catch (error) {
    fail('15. GET /statistics devuelve metricas numericas', error.message);
  }

  // 16. activeLoans aumenta.
  if (baseActiveLoans !== null && isNumber(activeAfterLoan)) {
    if (activeAfterLoan === baseActiveLoans + 1) pass('16. activeLoans aumenta');
    else fail('16. activeLoans aumenta', `base=${baseActiveLoans} despues=${activeAfterLoan}`);
  } else if (isNumber(activeAfterLoan) && activeAfterLoan >= 1) {
    pass('16. activeLoans aumenta (>=1 tras el prestamo)');
  } else {
    fail('16. activeLoans aumenta', 'no se pudo comparar');
  }

  // 17. Return devuelve 200.
  try {
    const { res, body } = await getJson(`${LIBRARY}/api/v1/returns`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ loanId }),
    });
    if (res.status === 200 && body?.data?.loan?.status === 'RETURNED') pass('17. Return (200)');
    else fail('17. Return (200)', `estado ${res.status}`);
  } catch (error) {
    fail('17. Return (200)', error.message);
  }

  // 18. Book vuelve available=true.
  try {
    const { body } = await getJson(`${LIBRARY}/api/v1/books`);
    const found = (body?.data?.items ?? []).find((b) => b._id === bookId);
    if (found && found.available === true) pass('18. Book vuelve available=true');
    else fail('18. Book vuelve available=true', `available=${found?.available}`);
  } catch (error) {
    fail('18. Book vuelve available=true', error.message);
  }

  // 19. Doble Return devuelve 409.
  try {
    const { res } = await getJson(`${LIBRARY}/api/v1/returns`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ loanId }),
    });
    if (res.status === 409) pass('19. Doble Return devuelve 409');
    else fail('19. Doble Return devuelve 409', `estado ${res.status}`);
  } catch (error) {
    fail('19. Doble Return devuelve 409', error.message);
  }

  // 20. DELETE Book funciona al no tener Loan ACTIVE.
  try {
    const { res } = await getJson(`${LIBRARY}/api/v1/books/${bookId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    if (res.status === 200) {
      pass('20. DELETE Book sin Loan activo (200)');
      bookId = null; // ya eliminado; no requiere limpieza adicional
    } else {
      fail('20. DELETE Book sin Loan activo (200)', `estado ${res.status}`);
    }
  } catch (error) {
    fail('20. DELETE Book sin Loan activo (200)', error.message);
  }

  // 21. Statistics responde 503 si Library se apaga (controlado y opcional).
  if (STATS_LIBDOWN) {
    try {
      const { res } = await getJson(`${STATS_LIBDOWN}/api/v1/summary`);
      if (res.status === 503) pass('21. Statistics 503 con Library caido');
      else fail('21. Statistics 503 con Library caido', `estado ${res.status}`);
    } catch (error) {
      fail('21. Statistics 503 con Library caido', error.message);
    }
  } else {
    skip('21. Statistics 503 con Library caido', 'define SMOKE_STATS_LIBDOWN_URL para probarlo');
  }

  // 22. Todos los servicios permanecen activos despues de errores esperados.
  let allAlive = true;
  for (const [name, base] of [
    ['Auth', AUTH],
    ['Library', LIBRARY],
    ['Statistics', STATISTICS],
  ]) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.status !== 200) {
        allAlive = false;
        fail('22. Servicios activos tras errores', `${name} estado ${res.status}`);
      }
    } catch (error) {
      allAlive = false;
      fail('22. Servicios activos tras errores', `${name}: ${error.message}`);
    }
  }
  if (allAlive) pass('22. Todos los servicios permanecen activos');

  // Limpieza defensiva: si el Book no se elimino (fallo previo), intentarlo.
  if (bookId) {
    try {
      await fetch(`${LIBRARY}/api/v1/books/${bookId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
    } catch {
      // Limpieza best-effort; no altera el resultado.
    }
  }

  console.log(`\nResultado: ${passed} PASS, ${failed} FAIL, ${skipped} SKIP`);
  process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error('Error inesperado en el smoke test:', error.message);
  process.exit(1);
});
