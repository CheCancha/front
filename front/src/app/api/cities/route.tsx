import { NextResponse, type NextRequest } from "next/server";

// --- Tipos para la respuesta de la API externa ---
interface GeoRefLocalidad {
  nombre: string;
  provincia: {
    nombre: string;
  };
}

interface GeoRefResponse {
  localidades: GeoRefLocalidad[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query || query.length < 3) {
    return NextResponse.json(
      { error: "Se requiere un mínimo de 3 caracteres para la búsqueda." },
      { status: 400 }
    );
  }

  const apiUrl = `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(
    query
  )}&campos=nombre,provincia.nombre&max=5`;

  try {
    const apiResponse = await fetch(apiUrl, {
      next: { revalidate: 86400 }, 
    });

    if (!apiResponse.ok) {
      throw new Error("La API de georeferencia no respondió correctamente.");
    }

    const data: GeoRefResponse = await apiResponse.json();

    return NextResponse.json({
      cities: data.localidades.map((l: GeoRefLocalidad) => ({
        nombre: l.nombre,
        provincia: l.provincia.nombre,
      })),
    });

  } catch (error) {
    console.error("[CITIES_API_ERROR]", error);
    return NextResponse.json(
      { error: "Error al obtener las ciudades." },
      { status: 500 }
    );
  }
}