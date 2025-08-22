"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils"; // Utilidad para clases condicionales

// --- 1. MODELOS DE DATOS Y DATOS DE EJEMPLO ---
type Court = {
  id: number;
  name: string;
  sport: "Pádel" | "Fútbol" | "Tenis";
};

type Booking = {
  id: number;
  courtId: number;
  customerName: string;
  startTime: string; // Formato "HH:00"
};

const courtsData: Court[] = [
  { id: 1, name: "Pádel - Vidrio", sport: "Pádel" },
  { id: 2, name: "Pádel - Cemento", sport: "Pádel" },
  { id: 3, name: "Fútbol 5", sport: "Fútbol" },
  { id: 4, name: "Tenis - Polvo", sport: "Tenis" },
];

const bookingsData: Booking[] = [
  { id: 101, courtId: 1, customerName: "Juan Pérez", startTime: "18:00" },
  { id: 102, courtId: 3, customerName: "Ana García", startTime: "19:00" },
  { id: 103, courtId: 1, customerName: "Carlos Díaz", startTime: "20:00" },
  { id: 104, courtId: 4, customerName: "María López", startTime: "16:00" },
];

const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 9}:00`.padStart(5, '0')); // 09:00 a 22:00

// --- 2. COMPONENTE PRINCIPAL DE LA PÁGINA DE RESERVAS ---
export default function BookingCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sportFilter, setSportFilter] = useState<"Todos" | Court["sport"]>("Todos");

  const filteredCourts = courtsData.filter(
    (court) => sportFilter === "Todos" || court.sport === sportFilter
  );

  const handleDateChange = (days: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + days);
      return newDate;
    });
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50">
      {/* --- Encabezado con Controles --- */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestión de Reservas</h1>
          <div className="flex items-center p-1 bg-white border rounded-lg">
            <button onClick={() => handleDateChange(-1)} className="p-1.5 text-gray-500 hover:text-black"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-black flex items-center gap-2"><Calendar size={16} /> Hoy</button>
            <button onClick={() => handleDateChange(1)} className="p-1.5 text-gray-500 hover:text-black"><ChevronRight size={20} /></button>
          </div>
          <span className="font-semibold text-lg text-gray-800">
            {currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
            {(["Todos", "Pádel", "Fútbol", "Tenis"] as const).map(sport => (
                <button 
                    key={sport} 
                    onClick={() => setSportFilter(sport)}
                    className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-semibold",
                        sportFilter === sport ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-100 border"
                    )}
                >
                    {sport}
                </button>
            ))}
            <button className="ml-4 flex items-center gap-2 px-4 py-2 bg-black text-white font-semibold rounded-lg">
                <PlusCircle size={18}/> Nueva Reserva
            </button>
        </div>
      </header>

      {/* --- Calendario / Grilla de Reservas --- */}
      <div className="bg-white border rounded-lg shadow-sm overflow-auto">
        <div 
          className="grid min-w-[800px]" 
          style={{ gridTemplateColumns: `60px repeat(${filteredCourts.length}, 1fr)` }}
        >
          {/* Esquina vacía */}
          <div className="sticky top-0 bg-white z-10"></div>
          
          {/* Nombres de las canchas */}
          {filteredCourts.map(court => (
            <div key={court.id} className="sticky top-0 text-center font-semibold p-3 border-b border-l bg-white z-10">
              {court.name}
            </div>
          ))}

          {/* Horarios y Celdas de Reserva */}
          {timeSlots.map(time => (
            <React.Fragment key={time}>
              <div className="text-right text-xs font-mono text-gray-500 pr-2 pt-3 border-r">{time}</div>
              {filteredCourts.map(court => {
                const booking = bookingsData.find(b => b.courtId === court.id && b.startTime === time);
                
                return (
                  <div key={`${court.id}-${time}`} className="relative h-16 border-b border-l p-1">
                    {booking ? (
                      <div className="bg-indigo-100 text-indigo-800 rounded-md h-full w-full p-2 text-xs font-semibold cursor-pointer hover:bg-indigo-200">
                        {booking.customerName}
                      </div>
                    ) : (
                      <button className="h-full w-full rounded-md text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors flex items-center justify-center">
                        <PlusCircle size={18}/>
                      </button>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}