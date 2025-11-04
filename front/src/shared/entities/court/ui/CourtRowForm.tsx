"use client";

import React from "react";
import { Trash2, X, PlusCircle } from "lucide-react";
import { CourtWithRelations, NewCourt } from "@/shared/entities/complex/types";
import { Sport } from "@prisma/client";
import {
  durationOptions,
  // --- ELIMINADO ---
  // hoursOptions,
} from "@/shared/constants/dashboard-settings";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/inputshadcn";

const priceHoursOptions = Array.from({ length: 30 }, (_, i) => {
  let label = `${String(i).padStart(2, "0")}:00`;
  if (i >= 24) {
    const nextDayHour = String(i % 24).padStart(2, "0");
    label = `${nextDayHour}:00`;
  }
  return {
    value: i, 
    label: label,
  };
});

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

  const groupedHours = [
    {
      label: "Madrugada",
      options: priceHoursOptions.filter((h) => h.value >= 0 && h.value <= 6),
    },
    {
      label: "Mañana",
      options: priceHoursOptions.filter((h) => h.value >= 7 && h.value <= 12),
    },
    {
      label: "Tarde",
      options: priceHoursOptions.filter((h) => h.value >= 13 && h.value <= 19),
    },
    {
      label: "Noche",
      options: priceHoursOptions.filter((h) => h.value >= 20 && h.value <= 23),
    },
    {
      label: "Transnoche (Día Siguiente)",
      options: priceHoursOptions.filter((h) => h.value >= 24),
    },
  ];

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
          <Input
            type="text"
            value={court.name}
            onChange={(e) => onCourtChange(id, "name", e.target.value)}
            required
          />
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deporte *
          </label>
          <Select
            value={court.sportId}
            onValueChange={(value) => onCourtChange(id, "sportId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar deporte" />
            </SelectTrigger>
            <SelectContent>
              {allSports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>
                  {sport.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-6 sm:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración Turno
          </label>
          <Select
            value={String(court.slotDurationMinutes)}
            onValueChange={(value) =>
              onCourtChange(id, "slotDurationMinutes", Number(value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar duración" />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <h4 className="text-sm font-semibold text-gray-700 pt-2">
          Reglas de Precios
        </h4>
        {court.priceRules.map((rule) => {
          const ruleId = "tempId" in rule ? rule.tempId : rule.id;
          return (
            <div
              key={ruleId}
              className="grid grid-cols-12 gap-x-3 gap-y-2 items-center bg-gray-50 p-3 rounded-md"
            >
              <div className="col-span-6 sm:col-span-3">
                <label className="text-xs font-medium">Desde</label>
                <Select
                  value={String(rule.startTime)}
                  onValueChange={(value) =>
                    onPriceRuleChange(id, ruleId, "startTime", Number(value))
                  }
                >
                  <SelectTrigger className="bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px] overflow-y-auto">
                    {groupedHours.map((group) => (
                      <SelectGroup key={`start-group-${group.label}`}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.options.map((opt) => (
                          <SelectItem
                            key={`start-${opt.value}`}
                            value={String(opt.value)}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="text-xs font-medium">Hasta</label>
                <Select
                  value={String(rule.endTime)}
                  onValueChange={(value) =>
                    onPriceRuleChange(id, ruleId, "endTime", Number(value))
                  }
                >
                  <SelectTrigger className="bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px] overflow-y-auto">
                    {groupedHours.map((group) => (
                      <SelectGroup key={`end-group-${group.label}`}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.options.map((opt) => (
                          <SelectItem
                            key={`end-${opt.value}`}
                            value={String(opt.value)}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-6 sm:col-span-2">
                <label className="text-xs font-medium">Precio</label>
                <Input
                  type="number"
                  placeholder="20000"
                  value={rule.price}
                  onChange={(e) =>
                    onPriceRuleChange(
                      id,
                      ruleId,
                      "price",
                      Number(e.target.value)
                    )
                  }
                  className="text-xs"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="text-xs font-medium">$ Seña</label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={rule.depositAmount}
                  onChange={(e) =>
                    onPriceRuleChange(
                      id,
                      ruleId,
                      "depositAmount",
                      Number(e.target.value)
                    )
                  }
                  className="text-xs"
                />
              </div>
              <div className="col-span-12 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => onRemovePriceRule(id, ruleId)}
                  className="w-full h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md text-xs cursor-pointer mt-4"
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
