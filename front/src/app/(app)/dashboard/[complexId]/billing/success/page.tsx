import { db } from "@/shared/lib/db";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default async function BillingSuccessPage({
  params,
}: {
  params: Promise<{ complexId: string }>;
}) {
  const { complexId } = await params;

  const complex = await db.complex.findUnique({
    where: { id: complexId },
    select: { name: true },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">¡Suscripción Exitosa!</h1>
      <p className="text-lg text-gray-600 max-w-md">
        {complex
          ? `Felicidades, ${complex.name}. Tu plan ha sido activado.`
          : "Tu plan ha sido activado."}
        Ya tenés acceso a todas las funcionalidades.
      </p>
      <Button asChild className="mt-8">
        <Link href={`/dashboard/${complexId}`}>Volver a mi panel</Link>
      </Button>
    </div>
  );
}
