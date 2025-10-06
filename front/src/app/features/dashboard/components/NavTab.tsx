"use client";

import { routes } from "@/routes";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

export default function DashboardNavTabs() {
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

  const tabs = [
    { name: "Dashboard", href: routes.app.dashboard(complexId) },
    { name: "Reservas", href: routes.app.reservations(complexId) },
    { name: "Analíticas", href: routes.app.analytics(complexId) },
    { name: "Ajustes", href: routes.app.settings(complexId) },
    { name: "Subscripción", href: routes.app.subscripción(complexId) },
  ];

  return (
    <nav className="border-b border-gray-200">
      <div className="flex items-center space-x-8 overflow-x-auto px-4 sm:px-0">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
              ${
                pathname === tab.href
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
              }
            `}
          >
            {tab.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
