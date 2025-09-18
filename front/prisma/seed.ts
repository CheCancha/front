// prisma/seed.ts (Versión Corregida)

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { normalizePhoneNumber } from '../src/lib/utils';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'ignacionweppler@gmail.com';
const ADMIN_PHONE = '1154702118'; // El número que ingresa el usuario

async function main() {
  console.log('Empezando el script de seeding...');

  // Primero eliminamos cualquier usuario existente con este email
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingUser) {
    console.log('Eliminando usuario admin existente...');
    await prisma.user.delete({
      where: { email: ADMIN_EMAIL },
    });
  }

  // También verificamos y eliminamos por teléfono normalizado por si hay conflictos
  const normalizedAdminPhone = normalizePhoneNumber(ADMIN_PHONE);
  const existingByPhone = await prisma.user.findUnique({
    where: { phone: normalizedAdminPhone },
  });

  if (existingByPhone && existingByPhone.email !== ADMIN_EMAIL) {
    console.log('Eliminando usuario existente con el mismo teléfono normalizado...');
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
    console.log('Script de seeding finalizado.');
  });