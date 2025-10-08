import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FullComplexData } from "@/shared/entities/complex/types";
import type { Complex } from "@prisma/client";

// --- Props para el componente principal ---
interface Props {
  data: FullComplexData;
}

// --- SECCIÓN 1: Lógica y componente para conectar Mercado Pago ---

const MercadoPagoConnectButton = ({ complexId }: { complexId: string }) => {
  const CLIENT_ID = process.env.NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/callback`;
  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${complexId}`;

  return (
    <a href={authUrl} className="inline-block w-full whitespace-nowrap rounded-lg bg-[#009EE3] py-2 px-4 text-center font-semibold text-white transition-colors hover:bg-[#0089cc] sm:w-auto">
      Conectar con Mercado Pago
    </a>
  );
};

const MercadoPagoConnect = ({ complex }: { complex: Complex }) => {
  const router = useRouter();
  const isConnected = !!complex.mp_connected_at;

  const handleDisconnect = async () => {
    const confirmation = window.confirm("¿Estás seguro de que quieres desconectar tu cuenta de Mercado Pago? No podrás recibir pagos online.");
    if (!confirmation) return;

    toast.loading("Desconectando...");
    try {
      const response = await fetch(`/api/mercadopago/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complexId: complex.id }),
      });
      toast.dismiss();
      if (!response.ok) throw new Error("No se pudo desconectar la cuenta.");
      toast.success("Cuenta de Mercado Pago desconectada.");
      router.refresh();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Error desconocido.");
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold leading-6 text-gray-900">Pagos de Clientes (Señas)</h3>
      <p className="mt-1 text-sm text-gray-500">Conectá tu propia cuenta de Mercado Pago para aceptar señas y pagos online de tus clientes.</p>
      <div className="mt-6 flex flex-col items-start gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
        <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-256.png" alt="Mercado Pago Logo" width={40} height={40} className="h-10 w-10 flex-shrink-0" />
        <div className="flex-1">
          {isConnected ? (
            <>
              <p className="font-medium text-green-600">Estado: Conectado</p>
              <p className="text-sm text-gray-500">Conectado el {new Date(complex.mp_connected_at!).toLocaleDateString()}</p>
            </>
          ) : (
            <>
              <p className="font-medium text-red-600">Estado: No conectado</p>
              <p className="text-sm text-gray-500">Aún no puedes recibir pagos online.</p>
            </>
          )}
        </div>
        {isConnected ? (
          <button onClick={handleDisconnect} className="w-full rounded-lg bg-gray-200 py-2 px-4 font-semibold text-gray-800 transition-colors hover:bg-gray-300 sm:w-auto">
            Desconectar
          </button>
        ) : (
          <MercadoPagoConnectButton complexId={complex.id} />
        )}
      </div>
    </div>
  );
};


// --- SECCIÓN 2: Lógica y componente para gestionar la suscripción a Che Cancha ---

const planMap = { FREE: "Demo", BASE: "Básico", ESTANDAR: "Estándar", FULL: "Pro" };
const cycleMap = { MENSUAL: "Mensual", ANUAL: "Anual" };
const statusMap = {
  EN_PRUEBA: { text: "En Prueba", variant: "secondary" as const },
  ACTIVA: { text: "Activa", variant: "default" as const },
  ATRASADA: { text: "Pago Atrasado", variant: "destructive" as const },
  CANCELADA: { text: "Cancelada", variant: "destructive" as const },
};

const SubscriptionManagement = ({ data: complex }: { data: FullComplexData }) => {
  const planName = planMap[complex.subscriptionPlan] || "Desconocido";
  const cycleName = complex.subscriptionCycle ? cycleMap[complex.subscriptionCycle] : "";
  const statusInfo = statusMap[complex.subscriptionStatus] || { text: "Desconocido", variant: "secondary" };

  return (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold leading-6 text-gray-900">Tu Suscripción a Che Cancha</h3>
        <p className="mt-1 text-sm text-gray-500">Gestioná tu plan de suscripción para acceder a todas las funcionalidades.</p>
        <Card>
            <CardHeader>
                <CardTitle>Tu Plan Actual</CardTitle>
                <CardDescription>
                    {complex.subscriptionStatus === "EN_PRUEBA"
                    ? "Estás en tu período de prueba gratuito con acceso a todas las funcionalidades."
                    : "Este es el plan al que estás suscripto actualmente."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div>
                        <h3 className="text-lg font-semibold">{`${planName} ${cycleName}`}</h3>
                        <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
                    </div>
                    {complex.subscriptionStatus === "EN_PRUEBA" && (
                        <Button asChild>
                            <Link href={`/dashboard/${complex.id}/billing/choose-plan`}>Elegir Plan y Suscribirme</Link>
                        </Button>
                    )}
                    {complex.subscriptionStatus === "ACTIVA" && (
                        <div className="flex gap-2">
                            <Button variant="outline" disabled>Cambiar de Plan (Próximamente)</Button>
                            <Button variant="destructive" disabled>Cancelar (Próximamente)</Button>
                        </div>
                    )}
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                    {complex.subscriptionStatus === "EN_PRUEBA" && complex.trialEndsAt && (
                        <li>Tu prueba gratuita termina el: <strong>{format(complex.trialEndsAt, "dd 'de' MMMM 'de' yyyy", { locale: es })}</strong>.</li>
                    )}
                    {complex.subscriptionStatus === "ACTIVA" && complex.currentPeriodEndsAt && (
                        <li>Tu suscripción se renovará el: <strong>{format(complex.currentPeriodEndsAt, "dd 'de' MMMM 'de' yyyy", { locale: es })}</strong>.</li>
                    )}
                </ul>
            </CardContent>
        </Card>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL UNIFICADO ---
export const PaymentsSettings = ({ data }: Props) => {
    return (
        <div className="space-y-12">
            <MercadoPagoConnect complex={data} />
            <hr className="border-gray-200" />
            <SubscriptionManagement data={data} />
        </div>
    );
};