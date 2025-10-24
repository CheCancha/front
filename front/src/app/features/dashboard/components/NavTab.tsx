"use client";

import { routes } from "@/routes";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { Lock } from "lucide-react";

// --- El componente ahora recibe props ---
interface DashboardNavTabsProps {
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
}

export default function DashboardNavTabs({ subscriptionPlan, subscriptionStatus }: DashboardNavTabsProps) {
  const pathname = usePathname();
  const params = useParams();

  const complexId = params.complexId as string;

  if (!complexId) {
    return (
      <div className="border-b border-gray-200">
        <div className="h-[58px]" />
      </div>
    );
  }
  
  const isProOrTrial = subscriptionPlan === 'FULL' || subscriptionStatus === 'EN_PRUEBA';

  const tabs = [
    { name: "Dashboard", href: routes.app.dashboard(complexId), pro: false },
    { name: "Reservas", href: routes.app.reservations(complexId), pro: false },
    { name: "Analíticas", href: routes.app.analytics(complexId), pro: true },
    { name: "Marketing", href: routes.app.marketing(complexId), pro: true },
    { name: "Gestión de Clientes", href: routes.app.customers(complexId), pro: true },
    { name: "Próximamente", href: routes.app.newfeatures(complexId), pro: true },
    { name: "Configuración", href: routes.app.settings(complexId), pro: false },
  ];

  return (
    <nav className="border-b border-gray-200">
      <div className="flex items-center space-x-8 overflow-x-auto px-4 sm:px-0">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const isProFeature = tab.pro;
          const canAccess = !isProFeature || isProOrTrial;

          if (canAccess) {
            // --- Renderiza el Link normal si el usuario tiene acceso ---
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
                  }
                `}
              >
                {tab.name}
              </Link>
            );
          } else {
            // --- Renderiza la Tab deshabilitada con Tooltip si es Pro y no tiene acceso ---
            return (
              <div key={tab.name} className="relative group">
                <span
                  className="flex items-center whitespace-nowrap border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-300 cursor-not-allowed"
                >
                  {tab.name}
                  <Lock className="w-3 h-3 ml-1.5" />
                </span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap">
                  Función del Plan Pro
                </div>
              </div>
            );
          }
        })}
      </div>
    </nav>
  );
}