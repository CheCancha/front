"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

type ChartData = {
  name: string; 
  total: number;
};

export function RevenueLineChart({ data }: { data: ChartData[] }) {
  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), "dd/MM");
  };

  const formatYAxis = (tickItem: number) => {
    return `$${(tickItem / 1000).toLocaleString("es-AR")}k`;
  };

  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="name" tickFormatter={formatXAxis} fontSize={12} />
        <YAxis tickFormatter={formatYAxis} fontSize={12} />
        <Tooltip formatter={formatTooltip} />
        <Legend />
        <Line
          type="monotone"
          dataKey="total"
          name="Ingresos"
          stroke="#ff4e02" //brand-orange
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
