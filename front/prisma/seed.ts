import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { normalizePhoneNumber } from '../src/shared/lib/utils';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'ignacionweppler@gmail.com';
const ADMIN_PHONE = '1154702118';

async function main() {
  console.log('Empezando el script de seeding...');

  // --- SEED DE DEPORTES (SIN JERARQUÍA) ---
  console.log('Limpiando la tabla de deportes...');
  await prisma.sport.deleteMany({});
  
  const sportsToCreate = [
    { name: 'Fútbol 5', slug: 'futbol-5' },
    { name: 'Fútbol 7', slug: 'futbol-7' },
    { name: 'Fútbol 11', slug: 'futbol-11' },
    { name: 'Pádel', slug: 'padel' },
    { name: 'Tenis', slug: 'tenis' },
    { name: 'Básquet', slug: 'basquet' },
    { name: 'Vóley', slug: 'voley' },
  ];

  console.log('Creando nuevos deportes...');
  await prisma.sport.createMany({
    data: sportsToCreate,
  });
  console.log(`${sportsToCreate.length} deportes creados exitosamente.`);
  
  // --- SEED DE USUARIO ADMIN ---
  console.log('\n--- Creando usuario admin ---');

  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingUser) {
    console.log('Eliminando usuario admin existente por email...');
    await prisma.user.delete({
      where: { email: ADMIN_EMAIL },
    });
  }

  // También verificamos y eliminamos por teléfono normalizado por si hay conflictos
  const normalizedAdminPhone = normalizePhoneNumber(ADMIN_PHONE);
  const existingByPhone = await prisma.user.findUnique({
    where: { phone: normalizedAdminPhone },
  });

  if (existingByPhone) {
    console.log('Eliminando usuario existente por teléfono...');
    await prisma.user.delete({
      where: { phone: normalizedAdminPhone },
    });
  }

  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log(`La contraseña '${password}' se ha hasheado correctamente.`);
  
  console.log(`El teléfono de entrada '${ADMIN_PHONE}' se normalizó a '${normalizedAdminPhone}' para guardarlo.`);

  const adminUser = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: 'Admin Ignacio',
      hashedPassword: hashedPassword,
      role: Role.ADMIN,
      phone: normalizedAdminPhone,
    },
  });

  console.log('Usuario ADMIN creado exitosamente:');
  console.log(`ID: ${adminUser.id}`);
  console.log(`Email: ${adminUser.email}`);
  console.log(`Teléfono guardado: ${adminUser.phone}`);
  console.log(`Rol: ${adminUser.role}`);
  console.log(`\n=== DATOS PARA LOGIN ===`);
  console.log(`Teléfono para ingresar: ${ADMIN_PHONE}`);
  console.log(`Contraseña: ${password}`);
  console.log(`========================`);
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\nScript de seeding finalizado.');
  });