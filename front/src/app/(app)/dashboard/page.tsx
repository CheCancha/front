import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { routes } from "@/routes";

// Esta página es un Server Component, por lo que puede usar 'async'
// y acceder a la base de datos de forma segura. El usuario nunca la ve.
export default async function DashboardRedirectPage() {
  // 1. Obtenemos la sesión del usuario en el servidor
  const session = await getServerSession(authOptions);

  // 2. Verificamos que sea un MANAGER
  if (session?.user?.role !== "MANAGER") {
    // Si no es manager (o no hay sesión), lo redirigimos a la home.
    // El middleware ya debería haberlo atrapado, pero esto es una doble seguridad.
    redirect(routes.public.home);
  }

  try {
    // 3. Buscamos su complejo en la base de datos
    const complex = await db.complex.findUnique({
      where: { managerId: session.user.id },
      select: { id: true },
    });

    // 4. Redirigimos basándonos en si tiene o no un complejo
    if (complex) {
      // Si encontramos el complejo, redirigimos a su dashboard específico
      redirect(routes.app.dashboard(complex.id));
    } else {
      // Si es un MANAGER pero aún no ha creado su complejo,
      // lo redirigimos a la página de creación.
      // TODO: Crear esta ruta: /dashboard/create-complex
      console.log(`Manager ${session.user.id} no tiene complejo. Redirigiendo a la creación.`);
      redirect("/dashboard/create-complex"); 
    }
  } catch (error) {
    console.error("Error al buscar complejo para el manager:", error);
    // En caso de error en la BBDD, redirigir a una página de error o a la home
    redirect(routes.public.home);
  }

  // Este return es un fallback, la ejecución nunca debería llegar aquí
  // porque las líneas de 'redirect' detienen la renderización.
  return null;
}

