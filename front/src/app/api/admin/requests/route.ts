import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";

// Esta función se encarga de manejar las peticiones GET a /api/admin/requests
export async function GET() {
  try {
    // 1. Verificamos la sesión en el servidor.
    const session = await getServerSession(authOptions);

    // 2. Medida de seguridad CRUCIAL:
    // Solo permitimos el acceso si el usuario está logueado Y tiene el rol de ADMIN.
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 3. Si la seguridad pasa, buscamos los datos en la base de datos.
    const requests = await db.inscriptionRequest.findMany({
      where: {
        status: "PENDIENTE",
      },
      orderBy: {
        createdAt: "asc", 
      },
    });

    // 4. Devolvemos los datos como JSON.
    return NextResponse.json(requests);
    
  } catch (error) {
    console.error("[ADMIN_REQUESTS_GET]", error);
    return new NextResponse("Error Interno del Servidor", { status: 500 });
  }
}

