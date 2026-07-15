import { sequelize } from './configs/db.js';
import {
  User,
  UserProfile,
  UserEmail,
  UserPasswordReset,
} from './src/users/user.model.js';
import { Role, UserRole } from './src/auth/role.model.js';
import { hashPassword } from './utils/password-utils.js';

const seed = async () => {
  try {
    console.log('PostgreSQL | Trying to connect...');
    await sequelize.authenticate();
    console.log('PostgreSQL | Connected to PostgreSQL');

    // Sincronizar los modelos por si las tablas no existen
    await sequelize.sync();

    // 1. Crear los roles necesarios
    const rolesToCreate = ['ADMIN_ROLE', 'USER_ROLE', 'EMPLOYEE_ROLE'];
    for (const roleName of rolesToCreate) {
      await Role.findOrCreate({ where: { Name: roleName } });
    }

    const adminRole = await Role.findOne({ where: { Name: 'ADMIN_ROLE' } });
    const userRole = await Role.findOne({ where: { Name: 'USER_ROLE' } });

    // 2. Hashear una contraseña genérica ("Admin1234!") para todos
    const hashedPassword = await hashPassword('Admin1234!');

    // 3. Usuarios de prueba (Deben coincidir con los IDs usados en MongoDB)
    const usersToSeed = [
      {
        id: 'user_premium_1',
        name: 'Usuario Premium 1',
        email: 'premium1@test.com',
        role: userRole.Id,
      },
      {
        id: 'user_vip_2',
        name: 'Usuario VIP 2',
        email: 'vip2@test.com',
        role: userRole.Id,
      },
      {
        id: 'user_inactive_3',
        name: 'Usuario Inactivo 3',
        email: 'inactive3@test.com',
        role: userRole.Id,
      },
      {
        id: 'user_new_4',
        name: 'Nuevo Usuario 4',
        email: 'new4@test.com',
        role: userRole.Id,
      },
      {
        id: 'user_regular_5',
        name: 'Usuario Regular 5',
        email: 'regular5@test.com',
        role: userRole.Id,
      },
      {
        id: 'user_regular_6',
        name: 'Usuario Regular 6',
        email: 'regular6@test.com',
        role: userRole.Id,
      },
      {
        id: 'user_regular_7',
        name: 'Usuario Regular 7',
        email: 'regular7@test.com',
        role: userRole.Id,
      },
      {
        id: 'user_regular_8',
        name: 'Usuario Regular 8',
        email: 'regular8@test.com',
        role: userRole.Id,
      },
      {
        id: 'admin_1',
        name: 'Administrador 1',
        email: 'admin1@test.com',
        role: adminRole.Id,
      },
      {
        id: 'admin_2',
        name: 'Administrador 2',
        email: 'admin2@test.com',
        role: adminRole.Id,
      },
    ];

    // 4. Poblar la base de datos
    for (const u of usersToSeed) {
      const [user, created] = await User.findOrCreate({
        where: { Id: u.id },
        defaults: {
          Name: u.name,
          Email: u.email,
          Password: hashedPassword,
          IsActive: true, // Se activa para que no requieran validación de email real para probar
        },
      });

      if (created) {
        // Crear las entidades relacionadas (Profile, Email, PasswordReset, UserRole)
        await UserProfile.create({
          UserId: user.Id,
          Phone: '12345678',
          Imagen: 'default.jpg',
          FechaNacimiento: new Date('1990-01-01'),
          Dpi: `100000000000${usersToSeed.indexOf(u)}`,
          IngresosMensuales: 10000.0,
          Direccion: 'Ciudad de Guatemala',
          NombreTrabajo: 'Desarrollador',
        });
        await UserEmail.create({ UserId: user.Id, EmailVerified: true });
        await UserPasswordReset.create({ UserId: user.Id });
        await UserRole.create({ UserId: user.Id, RoleId: u.role });
        console.log(
          `✅ Usuario creado: ${u.name} (${u.email}) -> ID: ${user.Id}`
        );
      } else {
        console.log(`ℹ️ El usuario ya existe: ${u.name} -> ID: ${user.Id}`);
      }
    }

    console.log('\n🚀 Poblamiento (Seed) finalizado con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el Seed:', error);
    process.exit(1);
  }
};

seed();
