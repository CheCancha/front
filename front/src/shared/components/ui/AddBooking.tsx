"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, PlusCircle, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

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
  startTime: string; 
};

const courtsData: Court[] = [
  { id: 1, name: "Pádel - Vidrio", sport: "Pádel" },
  { id: 2, name: "Pádel - Cemento", sport: "Pádel" },
  { id: 3, name: "Fútbol 5", sport: "Fútbol" },
  { id: 4, name: "Tenis - Polvo", sport: "Tenis" },
];

const initialBookingsData: Booking[] = [
  { id: 101, courtId: 1, customerName: "Juan Pérez", startTime: "18:00" },
  { id: 102, courtId: 3, customerName: "Ana García", startTime: "19:00" },
  { id: 103, courtId: 1, customerName: "Carlos Díaz", startTime: "20:00" },
  { id: 104, courtId: 4, customerName: "María López", startTime: "16:00" },
];

const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 9}:00`.padStart(5, '0'));


// --- 2. COMPONENTE MODAL PARA AÑADIR RESERVA ---
interface AddBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (bookingData: Omit<Booking, 'id'>) => void;
    courts: Court[];
    timeSlots: string[];
}

const AddBookingModal: React.FC<AddBookingModalProps> = ({ isOpen, onClose, onSubmit, courts, timeSlots }) => {
    const [customerName, setCustomerName] = useState("");
    const [courtId, setCourtId] = useState<number>(courts[0]?.id || 0);
    const [startTime, setStartTime] = useState(timeSlots[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim() || !courtId) return;
        onSubmit({
            customerName,
            courtId,
            startTime,
        });
        setCustomerName("");
        setCourtId(courts[0]?.id || 0);
        setStartTime(timeSlots[0]);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 m-4"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Añadir Nueva Reserva</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
                                <input
                                    id="customerName"
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Ej: Lionel Messi"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="court" className="block text-sm font-medium text-gray-700 mb-1">Cancha</label>
                                <select
                                    id="court"
                                    value={courtId}
                                    onChange={(e) => setCourtId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                    {courts.map(court => (
                                        <option key={court.id} value={court.id}>{court.name}</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                                <select
                                    id="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                    {timeSlots.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4">
                               <button type="submit" className="w-full bg-black text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors">
                                    Confirmar Reserva
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// --- 3. COMPONENTE PRINCIPAL DE LA PÁGINA DE RESERVAS ---
export default function BookingCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sportFilter, setSportFilter] = useState<"Todos" | Court["sport"]>("Todos");
  const [bookingsData, setBookingsData] = useState(initialBookingsData);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para el modal

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

  const handleAddBooking = (newBookingData: Omit<Booking, 'id'>) => {
    setBookingsData(prev => [
        ...prev,
        { ...newBookingData, id: Date.now() }
    ]);
  };

  return (
    <>
      <div className="flex-1 bg-gray-50">
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
              <button 
                onClick={() => setIsModalOpen(true)} // <-- Abre el modal
                className="ml-4 flex items-center gap-2 px-4 py-2 bg-black text-white font-semibold rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
              >
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
                        <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="h-full w-full rounded-md text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors flex items-center justify-center"
                        >
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

      {/* --- Renderizado del Modal --- */}
      <AddBookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddBooking}
        courts={courtsData}
        timeSlots={timeSlots}
      />
    </>
  );
}
