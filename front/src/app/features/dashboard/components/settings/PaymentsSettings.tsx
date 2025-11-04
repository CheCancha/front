import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
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
import { FullComplexData } from "@/shared/entities/complex/types";
import type { Complex } from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  XCircle,
} from "lucide-react"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";

// --- Props para el componente principal ---
interface Props {
  data: FullComplexData;
}

interface MPButtonProps {
  complex: Complex;
}

// --- SECCIÓN 1: Lógica y componente para conectar Mercado Pago ---
const MercadoPagoConnectButton = ({ complexId }: { complexId: string }) => {
  const CLIENT_ID = process.env.NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/callback`;
  
  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${complexId}`;

  return (
    <a
      href={authUrl}
      className="inline-block w-full whitespace-nowrap rounded-lg bg-[#009EE3] py-2 px-4 text-center font-semibold text-white transition-colors hover:bg-[#0089cc] sm:w-auto"
    >
      Conectar con Mercado Pago
    </a>
  );
};

export default function MPButton({ complex }: MPButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isConnected = !!complex.mp_connected_at;

  const handleDisconnect = async () => {
    setIsLoading(true);
    toast.loading("Desconectando...");
    try {
      const response = await fetch(`/api/mercadopago/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complexId: complex.id }),
      });
      
      toast.dismiss();
      if (!response.ok) {
        throw new Error("No se pudo desconectar la cuenta.");
      }
      
      toast.success("Cuenta de Mercado Pago desconectada.");
      router.refresh();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Error desconocido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold leading-6 text-bg-brand-dark">
        Pagos y Cobranzas
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Conecta tu cuenta de Mercado Pago para aceptar señas y pagos online.
      </p>
      
      <div className="mt-6 flex flex-col items-start gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
        <img
          src="https://logospng.org/download/mercado-pago/logo-mercado-pago-256.png"
          alt="Mercado Pago Logo"
          className="h-10 w-10 flex-shrink-0"
        />
        <div className="flex-1">
          {isConnected ? (
            <>
              <p className="font-medium text-green-600">Estado: Conectado</p>
              <p className="text-sm text-gray-500">
                Conectado el {new Date(complex.mp_connected_at!).toLocaleDateString()}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-red-600">Estado: No conectado</p>
              <p className="text-sm text-gray-500">
                Aún no puedes recibir pagos online.
              </p>
            </>
          )}
        </div>
        
        {isConnected ? (
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isLoading}
                className="w-full rounded-lg bg-gray-200 py-2 px-4 font-semibold text-gray-800 transition-colors hover:bg-gray-300 sm:w-auto disabled:opacity-50 cursor-pointer"
              >
                Desconectar
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Al desconectar tu cuenta, no podrás recibir pagos online a través de CheCancha. Podrás volver a conectarla en cualquier momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                  Sí, desconectar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <MercadoPagoConnectButton complexId={complex.id} />
        )}
      </div>
    </div>
  );
};

// --- SECCIÓN 2: Lógica y componente para gestionar la suscripción a Che Cancha ---

const planMap: { [key: string]: string } = {
  FREE: "Demo",
  BASE: "Básico",
  ESTANDAR: "Estándar",
  FULL: "Pro",
};
const cycleMap: { [key: string]: string } = {
  MENSUAL: "Mensual",
  ANUAL: "Anual",
};
const statusMap = {
  EN_PRUEBA: {
    text: "En Prueba",
    variant: "default" as const,
    icon: AlertTriangle,
  },
  ACTIVA: { text: "Activa", variant: "success" as const, icon: CheckCircle },
  ATRASADA: {
    text: "Pago Atrasado",
    variant: "destructive" as const,
    icon: AlertTriangle,
  },
  CANCELADA: {
    text: "Cancelada",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

interface CustomBadgeProps {
  variant: "default" | "secondary" | "destructive" | "outline" | "success";
  children: React.ReactNode;
  className?: string;
}

const CustomBadge: React.FC<CustomBadgeProps> = ({
  variant,
  children,
  className,
}) => {
  let baseClasses =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  if (variant === "success") {
    baseClasses +=
      " border-transparent bg-green-500 text-white hover:bg-green-500/80";
  } else if (variant === "default") {
    baseClasses +=
      " border-transparent bg-brand-orange text-white hover:bg-brand-orange/80";
  } else if (variant === "destructive") {
    baseClasses +=
      " border-transparent bg-red-500 text-white hover:bg-red-500/80";
  } else {
    return (
      <Badge
        variant={variant as "default" | "secondary" | "destructive" | "outline"}
        className={className}
      >
        {children}
      </Badge>
    );
  }

  return <span className={`${baseClasses} ${className}`}>{children}</span>;
};

const SubscriptionManagement = ({
  data: complex,
}: {
  data: FullComplexData;
}) => {
  const planName = planMap[complex.subscriptionPlan] || "Desconocido";
  const cycleName = complex.subscriptionCycle
    ? cycleMap[complex.subscriptionCycle]
    : "";
  const statusInfo = statusMap[complex.subscriptionStatus] || {
    text: "Desconocido",
    variant: "secondary" as const,
    icon: AlertTriangle,
  };
  const StatusIcon = statusInfo.icon;
  const isTrial = complex.subscriptionStatus === "EN_PRUEBA";
  const isExpired =
    complex.subscriptionStatus === "ATRASADA" ||
    complex.subscriptionStatus === "CANCELADA";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu Suscripción a CheCancha</CardTitle>
        <CardDescription>
          Gestioná tu plan de suscripción para acceder a todas las
          funcionalidades del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-gray-50 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-800">{`${planName} ${cycleName}`}</h3>
              <CustomBadge variant={statusInfo.variant} className="capitalize">
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.text}
              </CustomBadge>
            </div>

            {isTrial && complex.trialEndsAt && (
              <p className="text-sm text-gray-600">
                Tu prueba gratuita termina el:
                <strong className="ml-1 text-brand-dark">
                  {format(complex.trialEndsAt, "dd 'de' MMMM 'de' yyyy", {
                    locale: es,
                  })}
                </strong>
                .
              </p>
            )}
            {!isTrial && complex.currentPeriodEndsAt && (
              <p className="text-sm text-gray-600">
                Renovación automática el:
                <strong className="ml-1 text-brand-dark">
                  {format(
                    complex.currentPeriodEndsAt,
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: es }
                  )}
                </strong>
                .
              </p>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {isTrial && (
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/dashboard/${complex.id}/billing/choose-plan`}>
                  Elegir Plan y Suscribirme
                </Link>
              </Button>
            )}
            {!isTrial && !isExpired && (
              <>
                <Button variant="outline" disabled className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cambiar de Plan
                </Button>
                <Button
                  variant="destructive"
                  disabled
                  className="w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Suscripción
                </Button>
              </>
            )}
            {isExpired && (
              <Button variant="destructive" className="w-full sm:w-auto">
                Pagar Suscripción
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- COMPONENTE PRINCIPAL UNIFICADO ---
export const PaymentsSettings = ({ data }: Props) => {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h3 className="text-lg font-switzer font-semibold text-brand-dark">
          Conexión de Pagos
        </h3>
        <MPButton complex={data} />
      </section>

      <hr className="border-gray-200" />

      <section className="space-y-4">
        <h3 className="text-lg font-switzer font-semibold text-brand-dark">
          Gestión de Cuenta
        </h3>
        <SubscriptionManagement data={data} />
      </section>
    </div>
  );
};
