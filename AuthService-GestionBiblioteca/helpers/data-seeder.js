import { Role } from '../src/auth/role.model.js';
import {
  User,
  UserProfile,
  UserEmail,
  UserPasswordReset,
} from '../src/users/user.model.js';
import { UserRole } from '../src/auth/role.model.js';
import { USER_ROLE, ADMIN_ROLE, EMPLOYEE_ROLE } from './role-constants.js';
import { generateUserId } from './uuid-generator.js';
import { hashPassword } from '../utils/password-utils.js';

export const seedData = async () => {
  // Crear roles si no existen
  const roles = [ADMIN_ROLE, EMPLOYEE_ROLE, USER_ROLE];
  for (const name of roles) {
    await Role.findOrCreate({
      where: { Name: name },
      defaults: { Id: generateUserId(), Name: name },
    });
  }

  const adminEmail = 'adminb@gestor.local';
  const existingAdmin = await User.findOne({ where: { Email: adminEmail } });
  if (!existingAdmin) {
    const adminRole = await Role.findOne({ where: { Name: ADMIN_ROLE } });
    if (adminRole) {
      const userId = generateUserId();
      const profileId = generateUserId();
      const emailId = generateUserId();
      const userRoleId = generateUserId();
      const password = await hashPassword('ADMINB');

      await User.create({
        Id: userId,
        Name: 'Admin',
        Email: adminEmail,
        Password: password,
        IsActive: true,
      });

      await UserProfile.create({
        Id: profileId,
        UserId: userId,
        Imagen: '',
        Phone: '39539423',
        FechaNacimiento: new Date('1990-01-01'),
        Dpi: '1234567890123',
        IngresosMensuales: 15000.0,
      });

      await UserEmail.create({
        Id: emailId,
        UserId: userId,
        EmailVerified: true,
        EmailVerificationToken: null,
        EmailVerificationTokenExpiry: null,
      });

      // Mismo patrón que createNewUser (user-db.js): fila vacía, requerida por
      // el flujo de forgot/reset password (updatePasswordResetToken hace UPDATE,
      // no upsert; sin esta fila el reset queda silenciosamente roto).
      await UserPasswordReset.create({
        UserId: userId,
      });

      await UserRole.create({
        Id: userRoleId,
        UserId: userId,
        RoleId: adminRole.Id,
      });
    }
  }

  const employeeEmail = 'employee@gestor.local';
  const existingEmployee = await User.findOne({
    where: { Email: employeeEmail },
  });
  if (!existingEmployee) {
    const employeeRole = await Role.findOne({ where: { Name: EMPLOYEE_ROLE } });
    if (employeeRole) {
      const userId = generateUserId();
      const profileId = generateUserId();
      const emailId = generateUserId();
      const userRoleId = generateUserId();
      const password = await hashPassword('EMPLOYEE');

      await User.create({
        Id: userId,
        Name: 'Employee',
        Email: employeeEmail,
        Password: password,
        IsActive: true,
      });

      await UserProfile.create({
        Id: profileId,
        UserId: userId,
        Imagen: '',
        Phone: '30000000',
        FechaNacimiento: new Date('1995-05-05'),
        Dpi: '9876543210987',
        IngresosMensuales: 8000.0,
      });

      await UserEmail.create({
        Id: emailId,
        UserId: userId,
        EmailVerified: true,
        EmailVerificationToken: null,
        EmailVerificationTokenExpiry: null,
      });

      // Ver comentario equivalente en el bloque de admin arriba.
      await UserPasswordReset.create({
        UserId: userId,
      });

      await UserRole.create({
        Id: userRoleId,
        UserId: userId,
        RoleId: employeeRole.Id,
      });
    }
  }
};
