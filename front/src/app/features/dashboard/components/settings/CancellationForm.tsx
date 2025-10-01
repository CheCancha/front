"use client";

import React from "react";

interface CancellationFormProps {
  value: number;
  onChange: (value: number) => void;
}

const CANCELLATION_OPTIONS = [
  { label: "1 hora antes del turno", value: 1 },
  { label: "12 horas antes del turno", value: 12 },
  { label: "24 horas antes del turno", value: 24 },
  { label: "No permitir cancelaciones", value: 0 },
];

export const CancellationForm: React.FC<CancellationFormProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Política de Cancelaciones</h3>
        <p className="mt-1 text-sm text-gray-600">
          Define el plazo que tienen los jugadores para cancelar una reserva y recibir el reembolso de la seña.
        </p>
      </div>

      <div className="max-w-md">
        <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-gray-700">
          Permitir cancelaciones gratuitas hasta:
        </label>
        <select
          id="cancellationPolicy"
          name="cancellationPolicy"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-md"
        >
          {CANCELLATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500">
          Esta regla se le mostrará al jugador antes de pagar la seña.
        </p>
      </div>
    </div>
  );
};
