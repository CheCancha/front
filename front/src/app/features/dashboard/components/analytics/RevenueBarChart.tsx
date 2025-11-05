"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChartData = {
  name: string;
  ingresos: number;
  egresos: number;
  balance: number;
};

const formatYAxis = (tickItem: number) => {
  if (tickItem === 0) return "$0";
  return `$${(tickItem / 1000).toLocaleString("es-AR")}k`;
};

const formatTooltipValue = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function RevenueBarChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis tickFormatter={formatYAxis} fontSize={12} />
        <Tooltip formatter={formatTooltipValue} />
        <Legend />
        <Bar
          dataKey="ingresos"
          name="Ingresos"
          fill="#01c780" // Verde
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="egresos"
          name="Egresos"
          fill="#ef4444" // Rojo
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="balance"
          name="Balance Neto"
          fill="#0878f5" // Azul
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
