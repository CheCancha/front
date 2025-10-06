import { db } from "@/shared/lib/db";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const planMap = {
  FREE: "Demo",
  BASE: "Básico",
  ESTANDAR: "Estándar",
  FULL: "Pro",
};
const cycleMap = { MENSUAL: "Mensual", ANUAL: "Anual" };
const statusMap = {
  EN_PRUEBA: { text: "En Prueba", variant: "secondary" as const },
  ACTIVA: { text: "Activa", variant: "default" as const },
  ATRASADA: { text: "Pago Atrasado", variant: "destructive" as const },
  CANCELADA: { text: "Cancelada", variant: "destructive" as const },
};

export default async function BillingPage({
  params,
}: {
  params: Promise<{ complexId: string }>;
}) {
  const { complexId } = await params;

  const complex = await db.complex.findUnique({
    where: { id: complexId },
    select: {
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionCycle: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
    },
  });

  if (!complex) {
    return <div>Complejo no encontrado.</div>;
  }

  const planName = planMap[complex.subscriptionPlan] || "Desconocido";
  const cycleName = complex.subscriptionCycle
    ? cycleMap[complex.subscriptionCycle]
    : "";
  const statusInfo = statusMap[complex.subscriptionStatus] || {
    text: "Desconocido",
    variant: "secondary",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Facturación y Suscripción</h1>
        <p className="text-gray-500">
          Gestioná tu plan y revisá tu historial de pagos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu Plan Actual</CardTitle>
          <CardDescription>
            {complex.subscriptionStatus === "EN_PRUEBA"
              ? "Estás en tu período de prueba gratuito."
              : "Este es el plan al que estás suscripto actualmente."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">{`${planName} ${cycleName}`}</h3>
              <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
            </div>
            {complex.subscriptionStatus === "EN_PRUEBA" && (
              <Button asChild>
                <Link href={`/dashboard/${complexId}/billing/choose-plan`}>
                  Elegir Plan y Suscribirme
                </Link>
              </Button>
            )}
            {complex.subscriptionStatus === "ACTIVA" && (
              <div className="flex gap-2">
                <Button variant="outline">Cambiar de Plan</Button>
                <Button variant="destructive">Cancelar Suscripción</Button>
              </div>
            )}
          </div>

          <ul className="text-sm text-gray-600 space-y-2">
            {complex.subscriptionStatus === "EN_PRUEBA" &&
              complex.trialEndsAt && (
                <li>
                  Tu prueba gratuita termina el: **
                  {format(complex.trialEndsAt, "dd 'de' MMMM 'de' yyyy", {
                    locale: es,
                  })}
                  **.
                </li>
              )}
            {complex.subscriptionStatus === "ACTIVA" &&
              complex.currentPeriodEndsAt && (
                <li>
                  Tu suscripción se renovará automáticamente el: **
                  {format(
                    complex.currentPeriodEndsAt,
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: es }
                  )}
                  **.
                </li>
              )}
            <li>Podés cancelar o cambiar tu plan en cualquier momento.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
