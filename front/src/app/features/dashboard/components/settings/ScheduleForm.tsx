import React from 'react';
import type { Schedule } from '@prisma/client';
import { FullComplexData } from '@/shared/entities/complex/types';
import { dayMapping, hoursOptions } from '@/shared/constants/dashboard-settings';

type ScheduleDayKey = Exclude<keyof Schedule, "id" | "complexId">;

interface Props {
    data: FullComplexData;
    onChange: (dayKey: ScheduleDayKey, value: string | null) => void;
}

export const ScheduleForm = ({ data, onChange }: Props) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
            <h3 className="text-lg font-semibold">Horarios de Apertura por Día</h3>
            <p className="text-sm text-gray-500 mt-1">Define las horas de apertura y cierre. Si un día no se completa, se considerará cerrado.</p>
            <div className="space-y-4 mt-6">
                {Object.entries(dayMapping).map(([dayName, { open: openKey, close: closeKey }]) => {
                    const openValue = data.schedule?.[openKey] ?? "";
                    const closeValue = data.schedule?.[closeKey] ?? "";
                    const isOpen = typeof openValue === "number" && typeof closeValue === "number";

                    return (
                        <div key={dayName} className={`rounded-lg border-2 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center ${isOpen ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isOpen ? "bg-green-500" : "bg-gray-300"}`}></div>
                                <span className="font-medium text-gray-900">{dayName}</span>
                            </div>
                            <select value={openValue} onChange={(e) => onChange(openKey, e.target.value)} className="w-full p-2 rounded-md border border-neutral-300 text-sm">
                                <option value="">Apertura</option>
                                {hoursOptions.map(h => <option key={`${dayName}-open-${h.value}`} value={h.value}>{h.label}</option>)}
                            </select>
                            <select value={closeValue} onChange={(e) => onChange(closeKey, e.target.value)} className="w-full p-2 rounded-md border border-neutral-300 text-sm">
                                <option value="">Cierre</option>
                                {hoursOptions.map(h => <option key={`${dayName}-close-${h.value}`} value={h.value}>{h.label}</option>)}
                            </select>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);