import React from "react";
import { cn } from "@/shared/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  change?: string;
  changeType?: "increase" | "decrease";
}

export function MetricCard({
  title,
  value,
  icon,
  description,
  change,
  changeType,
}: MetricCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium tracking-tight text-gray-500">{title}</h3>
        {icon}
      </div>
      <div className="mt-1">
        <h2 className="text-2xl font-bold">{value}</h2>
        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {change && (
              <span className={cn(
                  "mr-1",
                  changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              )}>
                {change}
              </span>
            )}
            {description}
          </p>
        )}
      </div>
    </div>
  );
}