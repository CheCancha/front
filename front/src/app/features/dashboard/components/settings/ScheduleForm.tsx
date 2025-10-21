"use client";

import React from "react";
import type { Schedule } from "@prisma/client";
import { FullComplexData } from "@/shared/entities/complex/types";
import {
  dayMapping,
  hoursOptions,
} from "@/shared/constants/dashboard-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type ScheduleDayKey = Exclude<keyof Schedule, "id" | "complexId">;

interface Props {
  data: FullComplexData;
  onScheduleChange: (key: ScheduleDayKey, value: string | null) => void;
  onComplexChange: (key: "timeSlotInterval", value: number) => void;
}

export const ScheduleForm = ({
  data,
  onScheduleChange,
  onComplexChange,
}: Props) => (
  <div className="overflow-hidden">
    <h3 className="text-lg font-switzer font-semibold">Horarios y Reservas</h3>
    <p className="text-sm text-gray-500 mt-1">
      Define las horas de apertura y la visualización de los turnos en el
      calendario.
    </p>

    <div className="mt-6 border-t pt-6">
      <label
        htmlFor="timeSlotInterval"
        className="block text-sm font-medium text-brand-dark"
      >
        Intervalo de turnos en el calendario
      </label>
      <Select
        value={String(data.timeSlotInterval || 30)}
        onValueChange={(value) =>
          onComplexChange("timeSlotInterval", Number(value))
        }
      >
        <SelectTrigger className="mt-2 w-full max-w-xs">
          <SelectValue placeholder="Seleccionar intervalo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">Cada 30 minutos</SelectItem>
          <SelectItem value="60">Cada 1 hora</SelectItem>
        </SelectContent>
      </Select>
      <p className="mt-2 text-sm text-gray-500">
        Define cómo se muestran los horarios disponibles para reservar.
      </p>
    </div>

    <div className="space-y-4 mt-6 border-t pt-6">
      {Object.entries(dayMapping).map(
        ([dayName, { open: openKey, close: closeKey }]) => {
          const openValue = data.schedule?.[openKey];
          const closeValue = data.schedule?.[closeKey];
          const isOpen =
            typeof openValue === "number" && typeof closeValue === "number";

          return (
            <div
              key={dayName}
              className={`rounded-lg border-2 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center ${
                isOpen
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    isOpen ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
                <span className="font-medium text-brand-dark">{dayName}</span>
              </div>

              {/* Select de Apertura */}
              <Select
                value={openValue ? String(openValue) : ""}
                onValueChange={(value) => {
                  onScheduleChange(
                    openKey,
                    value === "null-val" ? null : value
                  );
                }}
              >
                <SelectTrigger className="bg-white min-w-[100px]">
                  <SelectValue placeholder="Apertura" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[288px] overflow-y-auto">
                  <SelectItem value="null-val">Cerrado</SelectItem>
                  {hoursOptions.map((h) => (
                    <SelectItem
                      key={`${dayName}-open-${h.value}`}
                      value={String(h.value)}
                    >
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Select de Cierre */}
              <Select
                value={closeValue ? String(closeValue) : ""}
                onValueChange={(value) => {
                  onScheduleChange(
                    closeKey,
                    value === "null-val" ? null : value
                  );
                }}
              >
                <SelectTrigger className="bg-white min-w-[100px]">
                  <SelectValue placeholder="Cierre" />
                </SelectTrigger>
                <SelectContent className="max-h-[288px] overflow-y-auto">
                  <SelectItem value="null-val">Cerrado</SelectItem>
                  {hoursOptions.map((h) => (
                    <SelectItem
                      key={`${dayName}-close-${h.value}`}
                      value={String(h.value)}
                    >
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
      )}
    </div>
  </div>
);
