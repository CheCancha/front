"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ChartData = {
  name: string;
  value: number;
};

const COLORS = [
  "#0878f5",
  "#eafae9",
  "#fe4321", //brand-orange
  "#051223",
  "#ccfc03",
  "#565500",
];

export function CourtRevenuePieChart({ data }: { data: ChartData[] }) {
  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Tooltip formatter={formatTooltip} />
        <Legend />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
