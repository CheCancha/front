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
  ExternalLink,
  RefreshCw,
  XCircle,
} from "lucide-react"; // Importando íconos
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

// --- SECCIÓN 1: Lógica y componente para conectar Mercado Pago ---
const MercadoPagoConnectButton = ({ complexId }: { complexId: string }) => {
  const CLIENT_ID = process.env.NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/callback`;
  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${complexId}`;

  return (
    <a href={authUrl}>
      <Button className="bg-[#009EE3] hover:bg-[#0089cc] text-white">
        <ExternalLink className="mr-2 h-4 w-4" />
        Conectar con Mercado Pago
      </Button>
    </a>
  );
};

const MercadoPagoConnect = ({ complex }: { complex: Complex }) => {
  const router = useRouter();
  const isConnected = !!complex.mp_connected_at;
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDisconnect = async () => {
    // ❌ Quitar todo el JSX del AlertDialog de aquí
    // ❌ Quitar el 'if (!confirmation) return;' (es de window.confirm)

    setIsLoading(true);
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
      toast.error(
        error instanceof Error ? error.message : "Error desconocido."
      );
    } finally {
      setIsLoading(false);
      setIsAlertOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagos de Clientes (Señas)</CardTitle>
        <CardDescription>
          Conectá tu propia cuenta de Mercado Pago para aceptar señas y pagos
          online de tus clientes de forma segura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-4 border rounded-lg">
          <div className="flex items-center gap-4 flex-1">
            <img
              src="https://logospng.org/download/mercado-pago/logo-mercado-pago-256.png"
              alt="Mercado Pago Logo"
              width={40}
              height={40}
              className="h-10 w-10 flex-shrink-0"
            />
            <div className="flex-1">
              {isConnected ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-700">Conectado</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Conectado desde el{" "}
                    {format(new Date(complex.mp_connected_at!), "dd/MM/yyyy", {
                      locale: es,
                    })}
                    .
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="font-semibold text-red-700">No Conectado</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    No puedes recibir pagos online. Conéctate para empezar.
                  </p>
                </>
              )}
            </div>
          </div>

          {isConnected ? (
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50"
                  disabled={isLoading}
                >
                  Desconectar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Estás seguro de desconectar?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    No podrás recibir pagos online hasta que vuelvas a conectar
                    tu cuenta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>
                    Volver
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisconnect} // 👈 El botón de acción llama a la lógica
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? "Desconectando..." : "Sí, desconectar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <MercadoPagoConnectButton complexId={complex.id} />
          )}
        </div>
      </CardContent>
    </Card>
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
        <MercadoPagoConnect complex={data} />
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
