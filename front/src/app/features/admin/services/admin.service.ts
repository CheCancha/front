import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";


export const getPendingInscriptionRequestsForAdmin = async () => {
  // 1. Verificamos la sesión directamente aquí, en el servidor.
  const session = await getServerSession(authOptions);

  // 2. Si el usuario no es ADMIN, lanzamos un error.
  if (session?.user?.role !== 'ADMIN') {
    throw new Error("Acceso no autorizado.");
  }

  // 3. Si es ADMIN, buscamos y devolvemos los datos.
  const requests = await db.inscriptionRequest.findMany({
    where: {
      status: "PENDIENTE",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return requests;
};

