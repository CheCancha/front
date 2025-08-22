"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MapPin, Clock, Wifi, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { BookingModal } from "@/shared/components/ui/BookingModal";

// --- TIPOS Y DATOS (Simulando el backend) ---
type Court = {
  id: number;
  name: string;
  sport: "Fútbol" | "Pádel";
};

type ClubProfile = {
  id: number;
  name: string;
  address: string;
  images: string[];
  courts: Court[];
  services: string[];
  hours: string;
  priceFrom: number;
  bookings: { courtId: number; time: string }[];
};

const clubs: ClubProfile[] = [
  {
    id: 1,
    name: "Palos Verdes Pádel",
    address: "Caseros 1727, Tostado",
    images: ["/paddle.jpg", "/paddle2.jpg", "/paddle3.jpg"],
    courts: [
      { id: 101, name: "Cancha 1 (Vidrio)", sport: "Pádel" as const },
      { id: 102, name: "Cancha 2 (Cemento)", sport: "Fútbol" as const },
    ],
    services: ["Wifi", "Vestuarios", "Estacionamiento", "Bar / Restaurante"],
    hours: "Lunes a Domingos: 9:00 a 23:00",
    priceFrom: 20000,
    bookings: [
      { courtId: 101, time: "18:00" },
      { courtId: 101, time: "21:00" },
      { courtId: 102, time: "19:00" },
    ],
  },
  // ... otros clubes
];

// --- COMPONENTES DE LA PÁGINA ---

const ImageCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextSlide = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden">
      {images.map((src, index) => (
        <Image
          key={index}
          src={src}
          alt={`Imagen del complejo ${index + 1}`}
          fill
          className={`object-cover transition-opacity duration-700 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"}`}
          priority={index === 0}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      <button onClick={prevSlide} className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/40"><ChevronLeft /></button>
      <button onClick={nextSlide} className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/40"><ChevronRight /></button>
    </div>
  );
};

// 2. BookingWidget ahora recibe una función para manejar el clic
const BookingWidget = ({ club, onSlotClick }: { club: ClubProfile; onSlotClick: (court: Court, time: string) => void; }) => {
  const [selectedCourt, setSelectedCourt] = useState<Court>(club.courts[0]);
  const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 9}:00`);
  const isBooked = (time: string) => club.bookings.some((b) => b.courtId === selectedCourt.id && b.time === time);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-foreground mb-4">Reservar un turno</h2>
      <div className="mb-6">
        <label className="text-sm font-semibold text-paragraph mb-2 block">1. Elegí la cancha</label>
        <div className="flex flex-wrap gap-2">
          {club.courts.map((court) => (
            <button
              key={court.id}
              onClick={() => setSelectedCourt(court)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors",
                selectedCourt.id === court.id
                  ? "bg-brand-orange text-white border-brand-orange"
                  : "bg-transparent text-foreground border-gray-300 hover:border-brand-orange"
              )}
            >
              {court.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-paragraph mb-2 block">2. Seleccioná un horario</label>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {timeSlots.map((time) => (
            <button
              key={time}
              disabled={isBooked(time)}
              // 3. Al hacer clic, llamamos a la función que viene por props
              onClick={() => onSlotClick(selectedCourt, time)}
              className={cn(
                "p-2 rounded-md text-center font-semibold transition-colors cursor-pointer",
                isBooked(time)
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed line-through"
                  : "bg-neutral-200 text-neutral-700 hover:bg-brand-green hover:text-white"
              )}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA DE PERFIL DEL CLUB ---
export default function ClubProfilePage() {
  const params = useParams();
  const clubId = Number(params.id);
  const club = clubs.find((c) => c.id === clubId);

  // 4. Estados para manejar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ court: Court; time: string } | null>(null);

  const handleSlotClick = (court: Court, time: string) => {
    setSelectedBooking({ court, time });
    setIsModalOpen(true);
  };

  if (!club) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold text-foreground">Club no encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <section className="relative mb-8">
              <ImageCarousel images={club.images} />
              <div className="absolute bottom-6 left-6 z-10">
                <h1 className="font-lora text-4xl md:text-5xl font-bold text-white">{club.name}</h1>
                <p className="text-lg text-gray-200 flex items-center gap-2 mt-1"><MapPin size={18} /> {club.address}</p>
              </div>
            </section>
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                {/* 5. Pasamos la función handleSlotClick al widget */}
                <BookingWidget club={club} onSlotClick={handleSlotClick} />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-foreground mb-3">Horarios del Club</h3>
                  <p className="flex items-center gap-2 text-paragraph"><Clock size={16} /> {club.hours}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-foreground mb-4">Servicios Incluidos</h3>
                  <ul className="grid grid-cols-2 gap-3 text-paragraph">
                    {club.services.map((service) => (
                      <li key={service} className="flex items-center gap-2 text-sm"><Wifi size={16} /> {service}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* 6. Renderizamos el modal si hay una reserva seleccionada */}
      {selectedBooking && club && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          club={club}
          court={selectedBooking.court}
          time={selectedBooking.time}
          date={new Date()} // En una app real, aquí iría la fecha seleccionada
          price={club.priceFrom} // En una app real, el precio dependería de la cancha y la hora
        />
      )}
    </>
  );
}
