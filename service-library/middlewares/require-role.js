/**
 * Middleware de autorizacion por rol para el Servicio Library.
 *
 * Se ejecuta DESPUES de validateJWT, que puebla req.userRole. Recibe uno o mas
 * roles permitidos y solo deja continuar la peticion si req.userRole coincide
 * con alguno de ellos. Segun el contrato del Sprint 2, las mutaciones de Books,
 * Loans y Returns exigen LIBRARIAN_ROLE:
 *
 *   router.post('/', validateJWT, requireRole('LIBRARIAN_ROLE'), controller)
 *
 * No monta rutas.
 */

/**
 * Crea un middleware que exige que req.userRole este dentro de allowedRoles.
 * Acepta roles como argumentos sueltos o como un arreglo:
 *
 *   requireRole('LIBRARIAN_ROLE')
 *   requireRole('LIBRARIAN_ROLE', 'ADMIN_ROLE')
 *   requireRole(['LIBRARIAN_ROLE', 'ADMIN_ROLE'])
 *
 * @param {...(string|string[])} allowedRoles Uno o mas roles autorizados.
 */
export const requireRole = (...allowedRoles) => {
  const allowed = new Set(allowedRoles.flat().filter(Boolean));

  return (req, res, next) => {
    // Sin rol en la peticion: validateJWT no se ejecuto antes o el token no lo
    // aporto. Se trata como no autenticado (401), no como rol insuficiente.
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'No hay token en la peticion',
      });
    }

    if (!allowed.has(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta accion',
      });
    }

    return next();
  };
};

export default requireRole;
