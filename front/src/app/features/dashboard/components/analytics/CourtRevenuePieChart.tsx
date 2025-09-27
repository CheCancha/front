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
  "#ff4e02",
  "#54c3fe",
  "#565500",
  "#01c780",
  "#d0b7fe",
  "#3b82f6",
];

export function CourtRevenuePieChart({ data }: { data: ChartData[] }) {
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
