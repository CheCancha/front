"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, PlusCircle, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { format, add, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/shared/lib/utils";
import type { Complex, Court, Booking as PrismaBooking, Sport } from '@prisma/client';

// --- 1. TIPOS DE DATOS ---
type CourtWithSport = Court & { sport: Sport };
type ComplexWithCourts = Complex & { courts: CourtWithSport[] };
type BookingWithCourt = PrismaBooking & { court: { slotDurationMinutes: number } };

// --- 2. COMPONENTE MODAL ---
interface AddBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (bookingData: { courtId: string; guestName: string; time: string; date: string }) => void;
    courts: Court[];
    timeSlots: string[];
    selectedDate: Date;
    initialValues?: { courtId: string; time: string };
}

const AddBookingModal: React.FC<AddBookingModalProps> = ({ isOpen, onClose, onSubmit, courts, timeSlots, selectedDate, initialValues }) => {
    const [guestName, setGuestName] = useState("");
    const [courtId, setCourtId] = useState(initialValues?.courtId || courts[0]?.id || "");
    const [time, setTime] = useState(initialValues?.time || timeSlots[0]);
    const bookingDate = format(selectedDate, 'yyyy-MM-dd');

    useEffect(() => {
        if (isOpen) {
            setCourtId(initialValues?.courtId || courts[0]?.id || "");
            setTime(initialValues?.time || timeSlots[0]);
            setGuestName("");
        }
    }, [isOpen, initialValues, courts, timeSlots]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim() || !courtId) return;
        onSubmit({ guestName, courtId, time, date: bookingDate });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 m-4">
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Añadir Nueva Reserva</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
                                <input id="customerName" type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" placeholder="Ej: Lionel Messi" required />
                            </div>
                            <div>
                                <label htmlFor="court" className="block text-sm font-medium text-gray-700 mb-1">Cancha</label>
                                <select id="court" value={courtId} onChange={(e) => setCourtId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                                    {courts.map(court => (<option key={court.id} value={court.id}>{court.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                                <select id="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                                    {timeSlots.map(t => (<option key={t} value={t}>{t}</option>))}
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

// --- 3. COMPONENTE PRINCIPAL ---
export default function BookingCalendarPage() {
    const params = useParams();
    const complexId = params.complexId as string;

    const [complex, setComplex] = useState<ComplexWithCourts | null>(null);
    const [bookings, setBookings] = useState<BookingWithCourt[]>([]);
    const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialValues, setModalInitialValues] = useState<{ courtId: string; time: string } | undefined>();

    const timeSlots = React.useMemo(() => {
        const slots = [];
        const open = complex?.openHour ?? 9;
        const close = complex?.closeHour ?? 23;
        for (let h = open; h < close; h++) {
            slots.push(`${String(h).padStart(2, '0')}:00`);
            slots.push(`${String(h).padStart(2, '0')}:30`);
        }
        return slots;
    }, [complex]);

    const fetchData = useCallback(async () => {
        if (!complexId) return;
        setIsLoading(true);
        try {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            const [complexRes, bookingsRes] = await Promise.all([
                fetch(`/api/complex/${complexId}/settings`),
                fetch(`/api/complex/${complexId}/bookings?date=${dateString}`)
            ]);
            
            if (!complexRes.ok || !bookingsRes.ok) throw new Error("Error al cargar los datos");

            const complexData = await complexRes.json();
            const bookingsData = await bookingsRes.json();
            
            setComplex(complexData);
            setBookings(bookingsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [complexId, currentDate]);

    useEffect(() => { fetchData() }, [fetchData]);

    const handleDateChange = (days: number) => {
        setCurrentDate(prev => add(prev, { days }));
    };

    const handleAddBooking = async (bookingData: { courtId: string; guestName: string; time: string; date: string }) => {
        try {
            const response = await fetch(`/api/complex/${complexId}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });
            if (!response.ok) throw new Error("No se pudo crear la reserva");
            fetchData();
        } catch (error) {
            console.error("Error creating booking:", error);
        }
    };
    
    const openModalForSlot = (courtId: string, time: string) => {
        setModalInitialValues({ courtId, time });
        setIsModalOpen(true);
    };

    if (isLoading || !complex) return <div>Cargando calendario...</div>;

    return (
        <>
            <div className="flex-1 bg-gray-50 p-6">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    {/* ... (Tus controles de fecha y filtros aquí. No los modifico.) ... */}
                </header>

                <div className="bg-white border rounded-lg shadow-sm overflow-auto">
                    <div className="grid min-w-[800px]" style={{ gridTemplateColumns: `60px repeat(${complex.courts.length}, 1fr)` }}>
                        <div className="sticky top-0 bg-white z-10"></div>
                        {complex.courts.map(court => (
                            <div key={court.id} className="sticky top-0 text-center font-semibold p-3 border-b border-l bg-white z-10">
                                {court.name}
                            </div>
                        ))}
                        
                        {timeSlots.map(time => (
                            <React.Fragment key={time}>
                                <div className="text-right text-xs font-mono text-gray-500 pr-2 pt-3 border-r">{time}</div>
                                {complex.courts.map(court => {
                                    const [slotHour, slotMinute] = time.split(':').map(Number);
                                    const slotStartMinutes = slotHour * 60 + slotMinute;

                                    const bookingInSlot = bookings.find(b => {
                                        if (b.courtId !== court.id) return false;
                                        const bookingStartMinutes = b.startTime * 60 + (b.startMinute || 0);
                                        const bookingEndMinutes = bookingStartMinutes + b.court.slotDurationMinutes;
                                        return slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes;
                                    });

                                    if (bookingInSlot && (bookingInSlot.startTime * 60 + (bookingInSlot.startMinute || 0)) !== slotStartMinutes) {
                                        return null;
                                    }
                                    
                                    const rowSpan = bookingInSlot ? bookingInSlot.court.slotDurationMinutes / 30 : 1;
                                    const cellHeight = 4; // 4rem = 64px
                                    const height = rowSpan * cellHeight;

                                    return (
                                        <div key={`${court.id}-${time}`} className="relative border-b border-l p-1" style={{ height: `${cellHeight}rem` }}>
                                            {bookingInSlot ? (
                                                <div className="bg-indigo-100 text-indigo-800 rounded-md w-full p-2 text-xs font-semibold cursor-pointer absolute top-0 left-0" style={{ height: `${height}rem`, zIndex: 10 }}>
                                                    {bookingInSlot.guestName || bookingInSlot.userId}
                                                </div>
                                            ) : (
                                                <button onClick={() => openModalForSlot(court.id, time)} className="h-full w-full rounded-md text-gray-300 hover:bg-gray-100 flex items-center justify-center">
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

            <AddBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddBooking}
                courts={complex.courts}
                timeSlots={timeSlots}
                selectedDate={currentDate}
                initialValues={modalInitialValues}
            />
        </>
    );
}