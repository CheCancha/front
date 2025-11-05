"use client";

import React, { memo, useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  TransactionType,
  BookingStatus,
} from "@prisma/client";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatCurrency } from "@/shared/helper/formatCurrency";

// --- TIPOS (Definir la estructura de la respuesta de la API) ---
type KpiData = {
  ingresos: number;
  egresos: number;
  neto: number;
};
type GroupedData = {
  name: string;
  total: number;
  type?: string;
};
type TransactionData = {
  id: string;
  createdAt: string;
  description: string;
  amount: number;
  type: string;
  paymentMethod: string;
  source: string;
  status: BookingStatus | TransactionType | null;
};

export type SummaryResponse = {
  kpis: KpiData;
  byPaymentMethod: GroupedData[];
  bySource: GroupedData[];
  recentTransactions: TransactionData[];
};


// --- Componente de Tarjeta KPI ---
const KpiCard = memo(
  ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    color?: string;
  }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
      <div
        className={cn(
          "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
          color || "bg-gray-100 text-gray-600"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>{" "}
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
);
KpiCard.displayName = "KpiCard";

// --- Componente de Esqueleto ---
const FinancialSummarySkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="lg:col-span-1 h-40 rounded-xl" />
      <Skeleton className="lg:col-span-2 h-40 rounded-xl" />
    </div>
      <Skeleton className="h-64 rounded-xl" />
  </div>
);

interface FinancialSummaryProps {
  data: SummaryResponse | null;
  isLoading: boolean;
  error: string | null;
}

// --- COMPONENTE PRINCIPAL ---
export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  data,
  isLoading,
  error,
}) => {
  
  if (isLoading) {
    return <FinancialSummarySkeleton />;
  }

  if (error) {
    return (
      <div className="text-red-500 flex items-center gap-2">
        <AlertTriangle /> {error}
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500">No hay datos para mostrar.</p>;
  }

  // Separamos las fuentes de ingresos y egresos
  const incomeSources = data.bySource.filter(
    (s) => s.type === TransactionType.INGRESO
  );
  const expenseSources = data.bySource.filter(
    (s) => s.type === TransactionType.EGRESO
  );

  const getStatusBadge = (
    status: BookingStatus | TransactionType | null,
    type: TransactionType
  ) => {
    let text = status ? status.toLowerCase() : type.toLowerCase();
    let classes = "";

    switch (status) {
      case BookingStatus.CANCELADO:
        text = "Cancelado";
        classes = "bg-red-100 text-red-800 opacity-70 line-through";
        break;
      case BookingStatus.COMPLETADO:
        text = "Completado";
        classes = "bg-blue-100 text-blue-800";
        break;
      default:
        if (type === TransactionType.EGRESO) {
          text = "Egreso";
          classes = "bg-gray-100 text-gray-700";
        } else {
          text = "Ingreso";
          classes = "bg-green-100 text-green-800";
        }
    }
    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-semibold capitalize",
          classes
        )}
      >
        {text}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Ingresos Totales"
          value={formatCurrency(data.kpis.ingresos)}
          icon={ArrowUpCircle}
          color="bg-green-100 text-green-600"
        />
        <KpiCard
          title="Egresos Totales"
          value={formatCurrency(data.kpis.egresos)}
          icon={ArrowDownCircle}
          color="bg-red-100 text-red-600"
        />
        <KpiCard
          title="Ganancia Neta"
          value={formatCurrency(data.kpis.neto)}
          icon={DollarSign}
          color="bg-blue-100 text-blue-600"
        />
      </div>

      {/* 2. Desgloses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desglose por Método de Pago */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="text-lg font-switzer font-semibold mb-4">
            Ingresos por Método de Pago
          </h4>
          <div className="space-y-3">
            {data.byPaymentMethod.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center"
              >
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <CreditCard className="h-4 w-4" />
                  {item.name}
                </span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose por Fuente (Ingresos y Egresos) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="text-lg font-switzer font-semibold mb-4">
            Desglose por Fuente
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fuentes de Ingreso */}
            <div>
              <h5 className="text-sm font-bold text-green-600 mb-2">
                INGRESOS
              </h5>
              <div className="space-y-3">
                {incomeSources.map((item) => (
                  <div
                    key={item.name}
                    className="flex justify-between items-center"
                  >
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <Briefcase className="h-4 w-4" />
                      {item.name}
                    </span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Fuentes de Egreso */}
            <div>
              <h5 className="text-sm font-bold text-red-600 mb-2">EGRESOS</h5>
              <div className="space-y-3">
                {expenseSources.map((item) => (
                  <div
                    key={item.name}
                    className="flex justify-between items-center"
                  >
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <Briefcase className="h-4 w-4" />
                      {item.name}
                    </span>
                    <span className="font-bold text-gray-900">
                      -{formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Libro Diario (Log de Transacciones) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="text-lg font-switzer font-semibold mb-4">
          Últimos Movimientos (Libro Diario)
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Método
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(tx.createdAt), "dd/MM/yy HH:mm", {
                      locale: es,
                    })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {tx.description}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.paymentMethod}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(tx.status, tx.type as TransactionType)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-4 whitespace-nowrap text-sm font-bold",
                      tx.type === TransactionType.INGRESO
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {tx.type === TransactionType.INGRESO ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
