import React from "react";
import { Trash2, X, PlusCircle } from "lucide-react";
import {
  CourtWithRelations,
  NewCourt,
  
} from "@/shared/entities/complex/types";
import { Sport } from "@prisma/client";
import {
  durationOptions,
  hoursOptions,
} from "@/shared/constants/dashboard-settings";

interface Props {
  court: CourtWithRelations | NewCourt;
  allSports: Sport[];
  onCourtChange: (id: string, field: string, value: string | number) => void;
  onPriceRuleChange: (
    courtId: string,
    ruleId: string,
    field: string,
    value: number
  ) => void;
  onAddPriceRule: (courtId: string) => void;
  onRemovePriceRule: (courtId: string, ruleId: string) => void;
  onDeleteCourt: (id: string) => void;
}

export const CourtFormRow = ({
  court,
  allSports,
  onCourtChange,
  onPriceRuleChange,
  onAddPriceRule,
  onRemovePriceRule,
  onDeleteCourt,
}: Props) => {
  const isNew = "isNew" in court;
  const id = isNew ? court.tempId : court.id;

  return (
    <div
      className={`border rounded-xl p-4 sm:p-6 space-y-4 shadow-sm ${
        isNew ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
      }`}
    >
      {/* --- Fila principal de la cancha --- */}
      <div className="grid grid-cols-12 gap-4 items-end">
        <div className="col-span-12 sm:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Cancha *
          </label>
          <input
            type="text"
            value={court.name}
            onChange={(e) => onCourtChange(id, "name", e.target.value)}
            required
            className="w-full rounded-lg p-2 border border-neutral-300"
          />
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deporte *
          </label>
          <select
            value={court.sportId}
            onChange={(e) => onCourtChange(id, "sportId", e.target.value)}
            className="w-full rounded-lg p-2 border border-neutral-300"
          >
            {allSports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-6 sm:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración Turno
          </label>
          <select
            value={court.slotDurationMinutes}
            onChange={(e) =>
              onCourtChange(id, "slotDurationMinutes", Number(e.target.value))
            }
            className="w-full rounded-lg p-2 border border-neutral-300"
          >
            {durationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-12 sm:col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => onDeleteCourt(id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title={isNew ? "Cancelar" : "Eliminar"}
          >
            {isNew ? <X className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* --- Sub-sección para Reglas de Precios --- */}
      <div className="pl-4 border-l-2 border-gray-200 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">
          Reglas de Precios
        </h4>
        {court.priceRules.map((rule) => {
          const ruleId = "tempId" in rule ? rule.tempId : rule.id;
          return (
            <div
              key={ruleId}
              className="grid grid-cols-12 gap-x-3 gap-y-2 items-center bg-white p-3 rounded-md border"
            >
              <div className="col-span-6 sm:col-span-3">
                <label className="text-xs font-medium">Desde</label>
                <select
                  value={rule.startTime}
                  onChange={(e) =>
                    onPriceRuleChange(
                      id,
                      ruleId,
                      "startTime",
                      Number(e.target.value)
                    )
                  }
                  className="w-full text-xs rounded-md border-gray-300"
                >
                  {hoursOptions.map((opt) => (
                    <option key={`start-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="text-xs font-medium">Hasta</label>
                <select
                  value={rule.endTime}
                  onChange={(e) =>
                    onPriceRuleChange(
                      id,
                      ruleId,
                      "endTime",
                      Number(e.target.value)
                    )
                  }
                  className="w-full text-xs rounded-md border-gray-300"
                >
                  {hoursOptions.map((opt) => (
                    <option key={`end-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-6 sm:col-span-2">
                <label className="text-xs font-medium">Precio</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={rule.price}
                  onChange={(e) =>
                    onPriceRuleChange(
                      id,
                      ruleId,
                      "price",
                      Number(e.target.value)
                    )
                  }
                  className="w-full text-xs rounded-md border-gray-300"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="text-xs font-medium">% Seña</label>
                <input
                  type="number"
                  placeholder="30"
                  value={rule.depositPercentage}
                  onChange={(e) =>
                    onPriceRuleChange(
                      id,
                      ruleId,
                      "depositPercentage",
                      Number(e.target.value)
                    )
                  }
                  className="w-full text-xs rounded-md border-gray-300"
                />
              </div>
              <div className="col-span-12 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => onRemovePriceRule(id, ruleId)}
                  className="w-full h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md text-xs"
                >
                  Quitar
                </button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => onAddPriceRule(id)}
          className="w-full mt-2 py-1 text-xs font-semibold border-2 border-dashed rounded-lg flex items-center justify-center gap-1 hover:bg-gray-100"
        >
          <PlusCircle size={14} /> Añadir franja horaria
        </button>
      </div>
    </div>
  );
};
