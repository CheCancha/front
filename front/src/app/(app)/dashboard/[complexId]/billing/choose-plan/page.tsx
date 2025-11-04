"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { SubscriptionPlanDetails, SubscriptionPlan } from "@prisma/client";
import { Spinner } from "@/shared/components/ui/Spinner";

// --- Helpers ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
const formatPrice = (price: number) => (price / 100).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

const planMap: Record<SubscriptionPlan, string> = {
  BASE: "Básico",
  FULL: "Pro",
  FREE: "Demo", 
  ESTANDAR: "Estándar",
};

const planFeatures = {
  BASE: [
    "Perfil público en CheCancha",
    "Calendario de Reservas Online",
    "Notificaciones básicas por email",
    "Integración con Mercado Pago para señas",
    "Soporte por email",
  ],
  FULL: [
    "Todo lo del Plan Básico",
    "Canchas Ilimitadas",
    "Reportes y Estadísticas Avanzadas",
    "Gestión de Clientes (CRM)",
    "Herramientas de Marketing (Cupones)",
    "Soporte Prioritario por WhatsApp",
    "Pack digital personalizado (QR)",
  ]
};

export default function ChoosePlanPage() {
  const [plans, setPlans] = useState<SubscriptionPlanDetails[]>([]);
  const [billingCycle, setBillingCycle] = useState<"ANUAL" | "MENSUAL">("ANUAL");
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const params = useParams();
  const router = useRouter();
  const complexId = params.complexId as string;

  useEffect(() => {
  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) throw new Error("No se pudieron cargar los planes.");
      const data = await response.json();
      // console.log('Datos recibidos de la API:', data);

      const availablePlans = data.filter((plan: SubscriptionPlanDetails) => plan.plan in planFeatures);
      // console.log('Planes después del filtro:', availablePlans);

      setPlans(availablePlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };
  fetchPlans();
}, []);

  const handleSubscription = async (planDetailsId: string) => {
    setIsSubmitting(planDetailsId);
    setError(null);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planDetailsId, complexId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "No se pudo iniciar la suscripción.");
      }

      const { init_point } = await response.json();
      router.push(init_point);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
      setIsSubmitting(null);
    }
  };
  
  const monthlyPlans = plans.filter(p => p.cycle === 'MENSUAL');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="flex flex-col justify-center items-center h-96 text-center">
        <h2 className="text-xl font-semibold text-red-600">Ocurrió un Error</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Reintentar</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12">
      <div className="text-center max-w-3xl mx-auto min-h-dvh mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark">
          Activá tu Cuenta
        </h1>
        <p className="text-lg text-gray-600 mt-3">
          Tu prueba gratuita está por terminar. Elegí un plan para continuar sin interrupciones y llevar tu complejo al siguiente nivel.
        </p>
      </div>

      {/* Toggle de Pago */}
      <div className="flex justify-center items-center gap-4 mb-12">
        <span className={cn("font-semibold", billingCycle === "MENSUAL" ? "text-brand-dark" : "text-gray-500")}>
          Pago Mensual
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === "MENSUAL" ? "ANUAL" : "MENSUAL")}
          className={cn(
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
            billingCycle === "ANUAL" ? "bg-orange-500" : "bg-gray-200"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              billingCycle === "ANUAL" ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
        <span className={cn("font-semibold", billingCycle === "ANUAL" ? "text-brand-dark" : "text-gray-500")}>
          Pago Anual
        </span>
      </div>

      {/* Tarjetas de Precios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {monthlyPlans.map((monthlyPlan) => {
          const yearlyPlan = plans.find(p => p.plan === monthlyPlan.plan && p.cycle === 'ANUAL');
          const currentPlan = billingCycle === 'ANUAL' ? yearlyPlan : monthlyPlan;
          const isPro = monthlyPlan.plan === 'FULL';
          
          if (!currentPlan) return null;

          return (
            <div
              key={monthlyPlan.id}
              className={cn(
                "rounded-xl p-8 flex flex-col border",
                isPro ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-brand-dark border-gray-200"
              )}
            >
              <h3 className="text-2xl font-semibold">{planMap[monthlyPlan.plan]}</h3>
              
              <div className="my-6">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold">
                    {formatPrice(billingCycle === 'ANUAL' && yearlyPlan ? yearlyPlan.price / 12 : monthlyPlan.price)}
                  </span>
                  <span className={cn("text-lg", isPro ? "text-gray-400" : "text-gray-500")}>/mes</span>
                </div>
                {billingCycle === 'ANUAL' && yearlyPlan && (
                  <p className={cn("text-sm mt-2 font-semibold", isPro ? "text-orange-400" : "text-green-600")}>
                    Pagás {formatPrice(yearlyPlan.price)} una vez al año.
                  </p>
                )}
              </div>

              <Button
                onClick={() => handleSubscription(currentPlan.id)}
                disabled={!!isSubmitting}
                className={cn(
                  "w-full text-base py-6",
                  isPro ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-brand-dark hover:bg-gray-800 text-white"
                )}
              >
                {isSubmitting === currentPlan.id ? (
                  <Spinner />
                ) : `Suscribirme al Plan ${planMap[monthlyPlan.plan]}`}
              </Button>
              
              <ul className="mt-8 space-y-3 text-left flex-grow">
                {(planFeatures[monthlyPlan.plan as keyof typeof planFeatures] || []).map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className={cn("w-5 h-5 flex-shrink-0 mr-2 mt-1", isPro ? "text-orange-500" : "text-green-500")} />
                    <span className={cn(isPro ? "text-gray-300" : "text-gray-600")}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      {error && <p className="text-center text-red-600 mt-8">{error}</p>}
    </div>
  );
}