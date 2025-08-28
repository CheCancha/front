"use client";

import React, { useState } from 'react';
import { cn } from "@/lib/utils"; 

// --- Componente para el Editor de Horarios ---
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const timeSlots = Array.from({ length: 16 }, (_, i) => `${i + 8}:00`.padStart(5, '0'));

// Estado inicial de ejemplo: Lunes a Viernes de 9 a 22, Sábados por la mañana.
const initialSchedule: Record<string, string[]> = {
  "Lunes": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
  "Martes": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
  "Miércoles": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
  "Jueves": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
  "Viernes": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
  "Sábado": ["09:00", "10:00", "11:00", "12:00"],
  "Domingo": [],
};

const ScheduleEditor = () => {
    const [selectedDay, setSelectedDay] = useState(daysOfWeek[0]);
    const [schedule, setSchedule] = useState(initialSchedule);

    const toggleTimeSlot = (day: string, time: string) => {
        setSchedule(prev => {
            const daySlots = prev[day as keyof typeof prev] || [];
            const newSlots = daySlots.includes(time)
                ? daySlots.filter(t => t !== time)
                : [...daySlots, time];
            return { ...prev, [day]: newSlots };
        });
    };
    
    return (
        <div>
            {/* Pestañas para seleccionar el día */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {daysOfWeek.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={cn(
                                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm',
                                selectedDay === day
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            )}
                        >
                            {day}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Grilla de horarios para el día seleccionado */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {timeSlots.map(time => {
                    const isSelected = schedule[selectedDay as keyof typeof schedule].includes(time);
                    return (
                        <button
                            key={time}
                            onClick={() => toggleTimeSlot(selectedDay, time)}
                            className={cn(
                                "p-2 rounded-lg text-sm font-semibold text-center transition-colors",
                                isSelected 
                                    ? "bg-black text-white" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {time}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


export default function SettingsPage() {
  return (
    <div className="space-y-8">
       {/* --- Encabezado --- */}
        <header>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ajustes del Club</h1>
            <p className="text-gray-600 mt-1">Configura los horarios, precios y políticas de tu club.</p>
        </header>

        {/* --- Formulario de Ajustes --- */}
        <div className="bg-white p-8 rounded-lg border shadow-sm">
            <form className="space-y-8 divide-y divide-gray-200">
                {/* Sección de Horarios (MODIFICADA) */}
                <div className="pt-8 first:pt-0">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">Horarios de Apertura</h3>
                    <p className="mt-1 text-sm text-gray-500">Selecciona los días y las horas en que tu club está disponible para reservas.</p>
                    <div className="mt-6">
                        <ScheduleEditor />
                    </div>
                </div>

                {/* Sección de Canchas */}
                 <div className="pt-8">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">Gestión de Canchas</h3>
                    <p className="mt-1 text-sm text-gray-500">Añade o edita los precios y señas requeridas para cada cancha.</p>
                     <div className="mt-6 space-y-4">
                        {/* Ejemplo de una cancha */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                            <span className="font-medium md:col-span-6">Pádel - Vidrio</span>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500">Precio Total / hora</label>
                                <input type="number" defaultValue="16000" className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500">Monto Seña</label>
                                <input type="number" defaultValue="4000" className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm" />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                            <span className="font-medium md:col-span-6">Fútbol 5</span>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500">Precio Total / hora</label>
                                <input type="number" defaultValue="20000" className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500">Monto Seña</label>
                                <input type="number" defaultValue="5000" className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección de Pagos */}
                <div className="pt-8">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">Pagos y Cobranzas</h3>
                    <p className="mt-1 text-sm text-gray-500">Conecta tu cuenta de Mercado Pago para aceptar señas y pagos online.</p>
                    <div className="mt-6">
                        <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg">
                            <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-256.png" alt="Mercado Pago Logo" className="h-10"/>
                            <div className="flex-1">
                                <p className="font-medium">Estado: No conectado</p>
                                <p className="text-sm text-gray-500">Aún no puedes recibir pagos online.</p>
                            </div>
                            <button type="button" className="bg-[#009EE3] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#0089cc] transition-colors">
                                Conectar con Mercado Pago
                            </button>
                        </div>
                    </div>
                </div>


                <div className="pt-8 flex justify-end">
                    <button type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800">Guardar Cambios</button>
                </div>
            </form>
        </div>
    </div>
  );
}