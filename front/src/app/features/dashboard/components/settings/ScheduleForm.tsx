import React from 'react';
import type { Schedule } from '@prisma/client';
import { FullComplexData } from '@/shared/entities/complex/types';
import { dayMapping, hoursOptions } from '@/shared/constants/dashboard-settings';

type ScheduleDayKey = Exclude<keyof Schedule, "id" | "complexId">;

interface Props {
    data: FullComplexData;
    onScheduleChange: (key: ScheduleDayKey, value: string | null) => void;
    onComplexChange: (key: 'timeSlotInterval', value: number) => void;
}

export const ScheduleForm = ({ data, onScheduleChange, onComplexChange }: Props) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
            <h3 className="text-lg font-semibold">Horarios y Reservas</h3>
            <p className="text-sm text-gray-500 mt-1">
                Define las horas de apertura y la visualización de los turnos en el calendario.
            </p>
            
            {/* --- NUEVO SELECTOR DE INTERVALO --- */}
            <div className="mt-6 border-t pt-6">
                <label htmlFor="timeSlotInterval" className="block text-sm font-medium text-gray-900">
                    Intervalo de turnos en el calendario
                </label>
                <select
                    id="timeSlotInterval"
                    name="timeSlotInterval"
                    value={data.timeSlotInterval || 30}
                    onChange={(e) => onComplexChange('timeSlotInterval', Number(e.target.value))}
                    className="mt-2 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                    <option value={30}>Cada 30 minutos</option>
                    <option value={60}>Cada 1 hora</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                    Define cómo se muestran los horarios disponibles para reservar.
                </p>
            </div>

            <div className="space-y-4 mt-6 border-t pt-6">
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
                            <select value={openValue} onChange={(e) => onScheduleChange(openKey, e.target.value)} className="w-full ...">
                                <option value="">Apertura</option>
                                {hoursOptions.map(h => <option key={`${dayName}-open-${h.value}`} value={h.value}>{h.label}</option>)}
                            </select>
                            <select value={closeValue} onChange={(e) => onScheduleChange(closeKey, e.target.value)} className="w-full ...">
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