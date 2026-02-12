import { createClient } from "@supabase/supabase-js";

// CONFIGURACIÓN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runMigration() {
  console.log("🚀 Iniciando migración de usuarios...");

  // 1. Obtener usuarios actuales de tu tabla pública
  const { data: dbUsers, error: fetchError } = await supabase
    .from("User")
    .select("id, email, name, phone");

  if (fetchError) {
    console.error("❌ Error al obtener usuarios:", fetchError);
    return;
  }

  for (const user of dbUsers) {
    // Si el ID ya es un UUID (tiene guiones), ya está migrado o es nuevo
    if (user.id.includes("-")) {
      console.log(`⏩ Saltando ${user.email} (ya parece ser un UUID).`);
      continue;
    }

    console.log(`Processing: ${user.email}...`);

    try {
      // 2. Crear usuario en Supabase Auth
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: "Password123!",
          email_confirm: true,
          user_metadata: {
            name: user.name,
            phone: user.phone,
          },
        });

      if (authError) {
        console.error(`❌ Error Auth para ${user.email}:`, authError.message);
        continue;
      }

      // 3. El paso de magia: Actualizar el ID viejo por el nuevo en tu tabla
      // Esto mantiene todas las relaciones (bookings, complexes, etc.) intactas.
      const { error: updateError } = await supabase
        .from("User")
        .update({
          id: authUser.user.id,
          hashedPassword: null,
        })
        .eq("email", user.email);

      if (updateError) {
        console.error(
          `❌ Error actualizando tabla User para ${user.email}:`,
          updateError.message,
        );
      } else {
        console.log(`✅ Migrado: ${user.email} (ID actualizado)`);
      }
    } catch (e) {
      console.error(`🔥 Error fatal en ${user.email}:`, e);
    }
  }

  console.log("🏁 Migración terminada.");
}

runMigration();
