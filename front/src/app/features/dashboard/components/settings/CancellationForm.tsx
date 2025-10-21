"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface CancellationFormProps {
  value: number;
  onChange: (value: number) => void;
}

const CANCELLATION_OPTIONS = [
  { label: "1 hora antes del turno", value: 1 },
  { label: "6 horas antes del turno", value: 6 },
  { label: "8 horas antes del turno", value: 8 },
  { label: "12 horas antes del turno", value: 12 },
  { label: "24 horas antes del turno", value: 24 },
  { label: "No permitir cancelaciones", value: 0 },
];

export const CancellationForm: React.FC<CancellationFormProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-switzer font-semibold text-brand-dark">
          Política de Cancelaciones
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Define el plazo que tienen los jugadores para cancelar una reserva y
          recibir el reembolso de la seña.
        </p>
      </div>

      <div className="max-w-md">
        <label
          htmlFor="cancellationPolicy"
          className="block text-sm font-medium text-gray-700"
        >
          Permitir cancelaciones gratuitas hasta:
        </label>
        <Select
          value={String(value)}
          onValueChange={(val) => onChange(parseInt(val))}
        >
          <SelectTrigger id="cancellationPolicy" className="mt-1">
            <SelectValue placeholder="Seleccionar política..." />
          </SelectTrigger>
          <SelectContent>
            {CANCELLATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs text-gray-500">
          Esta regla se le mostrará al jugador antes de pagar la seña.
        </p>
      </div>
    </div>
  );
};
