// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { normalizePhoneNumber } from "../src/shared/lib/utils";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "ignacionweppler@gmail.com";
const ADMIN_PHONE = "1154702118";

async function main() {
  console.log("Empezando el script de seeding (modo no destructivo)...");

  // --- SEED DE DEPORTES  ---
  const sportsToCreate = [
    { name: "Fútbol 5", slug: "futbol-5" },
    { name: "Fútbol 7", slug: "futbol-7" },
    { name: "Fútbol 11", slug: "futbol-11" },
    { name: "Pádel", slug: "padel" },
    { name: "Tenis", slug: "tenis" },
    { name: "Básquet", slug: "basquet" },
    { name: "Vóley", slug: "voley" },
  ];

  console.log("\nAsegurando que todos los deportes existan...");
  for (const sport of sportsToCreate) {
    await prisma.sport.upsert({
      where: { slug: sport.slug },
      update: { name: sport.name },
      create: sport,
    });
  }
  console.log("Deportes verificados/creados.");

  // --- SEED DE AMENITIES ---
  const amenitiesToCreate = [
    { name: "Wi-Fi", slug: "wifi", icon: "Wifi" },
    { name: "Vestuarios", slug: "vestuarios", icon: "ShowerHead" },
    { name: "Estacionamiento", slug: "estacionamiento", icon: "ParkingCircle" },
    { name: "Bar", slug: "bar", icon: "Beer" },
    { name: "Restaurante", slug: "restaurante", icon: "UtensilsCrossed" },
    { name: "Canchas Techadas", slug: "canchas-techadas", icon: "Building" },
    { name: "Alquiler de Equipo", slug: "alquiler-equipo", icon: "Swords" },
    { name: "Parrillas", slug: "parrillas", icon: "Flame" },
    { name: "Duchas", slug: "duchas", icon: "ShowerHead" },
    { name: "Agua Caliente", slug: "agua-caliente", icon: "ThermometerSun" },
    { name: "Tienda Deportiva", slug: "tienda-deportiva", icon: "Store" },
    { name: "Área para Niños", slug: "area-ninos", icon: "Baby" },
  ];

  console.log("\nAsegurando que todas las comodidades existan...");
  for (const amenity of amenitiesToCreate) {
    await prisma.amenity.upsert({
      where: { slug: amenity.slug },
      update: { name: amenity.name, icon: amenity.icon },
      create: amenity,
    });
  }
  console.log("Comodidades verificadas/creadas.");

  // --- SEED DE USUARIO ADMIN ---
  console.log("\n--- Verificando usuario admin ---");
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!existingUser) {
    console.log("Usuario admin no encontrado, creando uno nuevo...");
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 12);
    const normalizedAdminPhone = normalizePhoneNumber(ADMIN_PHONE);

    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Admin Ignacio",
        hashedPassword: hashedPassword,
        role: Role.ADMIN,
        phone: normalizedAdminPhone,
      },
    });
    console.log("Usuario ADMIN creado exitosamente.");
    console.log(`\n=== DATOS PARA LOGIN ===`);
    console.log(`Email para ingresar: ${ADMIN_EMAIL}`);
    console.log(`Contraseña: ${password}`);
    console.log(`========================`);
  } else {
    console.log("El usuario admin ya existe.");
  }
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("\nScript de seeding finalizado.");
  });
