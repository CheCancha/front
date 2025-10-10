import { db } from "@/shared/lib/db";
import { notFound } from "next/navigation";
import { ClientPage } from "@/app/features/public/components/courts/ClientPage";
import type {
  Court,
  PriceRule,
  Sport,
  Image as PrismaImage,
  Schedule,
  Amenity,
  Review,
  User,
} from "@prisma/client";

// --- TIPOS EXPORTADOS ---
export type { PrismaImage, Schedule, Amenity };
export type ReviewWithUser = Review & { user: User };
export type CourtWithPriceRules = Court & {
  priceRules: PriceRule[];
  sport: Sport;
};
export type ComplexProfileData = NonNullable<
  Awaited<ReturnType<typeof getComplex>>
>;
export type ValidStartTime = {
  time: string;
  courts: { courtId: string; available: boolean }[];
};

// --- FUNCIÓN DE OBTENCIÓN DE DATOS (SERVER) ---
async function getComplex(slug: string) {
  const complex = await db.complex.findUnique({
    where: { slug },
    include: {
      images: true,
      courts: {
        include: {
          priceRules: true,
          sport: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      schedule: true,
      amenities: true,
      reviews: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
  return complex;
}

// --- COMPONENTE DE PÁGINA (SERVER) ---
export default async function ComplexProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const complex = await getComplex(slug);

  if (!complex) {
    notFound();
  }

  return <ClientPage complex={complex} />;
}
