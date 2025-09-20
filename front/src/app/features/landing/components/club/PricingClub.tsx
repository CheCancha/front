"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ButtonPrimary, ButtonSecondary } from "@/shared/components/ui/Buttons";

const plans = [
  {
    name: "Plan Base",
    priceMonthly: 52000,
    priceYearly: 499200,
    description: "1 - 3 Canchas",
    features: [
      "Sistema de gestión de turnos",
      "Grilla de turnos dinámica",
      "Gestión de caja y stock",
      "Multiusuario y Multiplataforma",
      "Soporte 24/7",
    ],
    isPopular: false,
  },
  {
    name: "Plan Estándar",
    priceMonthly: 83000,
    priceYearly: 796800,
    description: "4 - 6 Canchas",
    features: [
      "Todo lo del Plan Base",
      "Reportes estadísticos",
      "Automatización de reservas",
      "Recordatorios automáticos",
      "Asesoramiento para optimizar tu club",
    ],
    isPopular: true,
  },
  {
    name: "Plan Full",
    priceMonthly: 109000,
    priceYearly: 1046400,
    description: "7 o más Canchas",
    features: [
      "Todo lo del Plan Estándar",
      "Sistema de control de acceso",
      "Ventas 24/7 con cobro de señas",
      "Pack digital personalizado (QR)",
      "Soporte prioritario",
    ],
    isPopular: false,
  },
];

const formatPrice = (price: number) => {
  return price.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });
};

export const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly"
  );

  const getPlanClassName = (planName: string, isPopular: boolean) => {
    if (isPopular) {
      return "bg-foreground text-background border-foreground shadow-2xl";
    }
    if (planName === "Plan Base") {
      return "bg-background text-foreground border-gray-200";
    }
    if (planName === "Plan Full") {
      return "bg-neutral-100 text-foreground border-gray-200";
    }
    return "bg-white border-gray-200";
  };

  return (
    <motion.section
      className="py-20 bg-white"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.8 } },
      }}
    >
      <div className="container mx-auto px-6" id="pricing">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-lora text-4xl md:text-5xl font-semibold text-foreground">
            Planes simples para cada complejo
          </h2>
          <p className="text-lg text-paragraph mt-4">
            Elegí el plan que mejor se adapte a tu tamaño y empezá a gestionar
            tu club de forma profesional.
          </p>
        </div>

        {/* Toggle de Pago */}
        <div className="flex justify-center items-center gap-4 mb-16">
          <span
            className={cn(
              "font-semibold",
              billingCycle === "monthly" ? "text-foreground" : "text-paragraph"
            )}
          >
            Pago Mensual
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2",
              billingCycle === "yearly" ? "bg-brand-orange" : "bg-gray-200"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                billingCycle === "yearly" ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
          <span
            className={cn(
              "font-semibold",
              billingCycle === "yearly" ? "text-foreground" : "text-paragraph"
            )}
          >
            Pago Anual <span className="text-brand-green">(20% OFF)</span>
          </span>
        </div>

        {/* Tarjetas de Precios */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl p-8 flex flex-col border transition-all duration-300",
                getPlanClassName(plan.name, plan.isPopular)
              )}
            >
              {plan.isPopular && (
                <div className="text-center mb-4">
                  <span className="bg-brand-orange/20 text-brand-orange text-xs font-bold px-3 py-1 rounded-full">
                    MÁS POPULAR
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-lora font-semibold">{plan.name}</h3>
              <p
                className={cn(
                  "mt-1",
                  plan.isPopular ? "text-background/80" : "text-paragraph"
                )}
              >
                {plan.description}
              </p>

              <div className="my-8">
                {billingCycle === "yearly" ? (
                  <div className="flex flex-col items-start">
                    <span
                      className={cn(
                        "text-2xl font-bold opacity-50 line-through",
                        plan.isPopular ? "text-background/70" : "text-paragraph"
                      )}
                    >
                      {formatPrice(plan.priceMonthly)}
                    </span>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-black">
                        {formatPrice(plan.priceYearly / 12)}
                      </span>
                      <span
                        className={cn(
                          "text-lg",
                          plan.isPopular
                            ? "text-background/80"
                            : "text-paragraph"
                        )}
                      >
                        /mes
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black">
                      {formatPrice(plan.priceMonthly)}
                    </span>
                    <span
                      className={cn(
                        "text-lg",
                        plan.isPopular ? "text-background/80" : "text-paragraph"
                      )}
                    >
                      /mes
                    </span>
                  </div>
                )}
              </div>

              <p
                className={cn(
                  "text-sm mb-8 h-5",
                  plan.isPopular ? "text-background/80" : "text-paragraph"
                )}
              >
                {billingCycle === "yearly" &&
                  `Facturado anualmente por ${formatPrice(plan.priceYearly)}`}
              </p>

              {/* --- BOTONES --- */}
              {plan.isPopular ? (
                <ButtonPrimary
                  href={`/inscriptions?plan=${encodeURIComponent(plan.name)}`}
                  className="w-full bg-brand-orange border-2 border-brand-orange text-white hover:bg-foreground"
                >
                  Probar 1 Mes Gratis
                </ButtonPrimary>
              ) : (
                <ButtonSecondary
                  href={`/inscriptions?plan=${encodeURIComponent(plan.name)}`}
                  className="w-full"
                >
                  Probar 1 Mes Gratis
                </ButtonSecondary>
              )}

              <ul className="mt-8 space-y-3 text-left flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check
                      className={cn(
                        "w-5 h-5 flex-shrink-0 mr-2 mt-1",
                        plan.isPopular
                          ? "text-background/70"
                          : "text-brand-green"
                      )}
                    />
                    <span
                      className={cn(
                        plan.isPopular ? "text-background/90" : "text-paragraph"
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
