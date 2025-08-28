"use client";

import { useSession } from "next-auth/react";
import {  Calendar, User, Mail, Phone, Loader2 } from "lucide-react";
import Navbar from "@/shared/components/Navbar";

const userBookings = [
    { id: 1, court: "Pádel - Vidrio", date: "28 de Agosto, 2025", time: "19:00", status: "Confirmado" },
    { id: 2, court: "Fútbol 5", date: "22 de Agosto, 2025", time: "21:00", status: "Completado" },
    { id: 3, court: "Pádel - Vidrio", date: "15 de Agosto, 2025", time: "19:00", status: "Completado" },
];

export default function ProfilePage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return <p>Acceso denegado.</p>;
    }
    
    const user = session?.user;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Tarjeta de Información del Usuario */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <User size={18} className="text-gray-500" />
                            <span className="text-gray-800">{user?.name || "No especificado"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail size={18} className="text-gray-500" />
                            <span className="text-gray-800">{user?.email || "No especificado"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={18} className="text-gray-500" />
                            <span className="text-gray-800">11-2233-4455</span> {/* Reemplazar con dato real */}
                        </div>
                    </div>
                </div>

                {/* Historial de Reservas */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Mis Próximas Reservas</h2>
                    <ul className="divide-y divide-gray-200">
                        {userBookings.map(booking => (
                            <li key={booking.id} className="py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">{booking.court}</p>
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <Calendar size={14} />
                                        {booking.date} a las {booking.time} hs
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    booking.status === 'Confirmado' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                    {booking.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    );
}
