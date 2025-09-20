"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: number;
}

export const Spinner: React.FC<SpinnerProps> = ({ className, size = 24 }) => {
  return (
    <Loader2
      style={{ width: size, height: size }}
      className={cn("animate-spin text-gray-500", className)}
    />
  );
};
