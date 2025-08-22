"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowDownUp, SlidersHorizontal, List, Map } from 'lucide-react';
import Navbar from '@/shared/components/Navbar';
import Footer from '@/shared/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchBar } from '@/shared/components/ui/Searchbar';
import { BookingModal } from '@/shared/components/ui/BookingModal';

// --- TIPOS Y DATOS (Simulando el backend) ---
type Club = {
  id: number;
  name: string;
  address: string;
  priceFrom: number;
  imageUrl: string;
  availableSlots: string[];
};

const searchResults: Club[] = [
    { id: 1, name: "Palos Verdes Pádel", address: "Caseros 1727, Tostado", priceFrom: 20000, imageUrl: "/paddle.jpg", availableSlots: ["18:00", "20:00", "21:00"] },
    { id: 2, name: "Complejo La Redonda", address: "Av. San Martín 550, Tostado", priceFrom: 24000, imageUrl: "https://images.unsplash.com/photo-1551955133-a8a37d22a472?q=80&w=2070&auto=format&fit=crop", availableSlots: ["19:00", "20:00", "22:00"] },
    { id: 3, name: "El Galpón Fútbol", address: "Ruta 95 km 101, Tostado", priceFrom: 30000, imageUrl: "https://images.unsplash.com/photo-1599494143890-104c315a6a24?q=80&w=1974&auto=format&fit=crop", availableSlots: ["18:00", "21:00", "22:00"] },
    { id: 4, name: "Sacala X4", address: "Av. Pueyrredón 2660, Tostado", priceFrom: 32000, imageUrl: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1907&auto=format&fit=crop", availableSlots: ["19:00", "20:00"] }
];

// --- COMPONENTES REUTILIZABLES ---

const FilterBar = ({ view, setView }: { view: "list" | "map"; setView: (v: "list" | "map") => void; }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
    <div className="flex items-center gap-2">
      <button className="px-4 py-2 bg-white border border-gray-300 rounded-full flex items-center gap-2 hover:bg-gray-100"><ArrowDownUp size={16} /> Ordenar</button>
      <button className="px-4 py-2 bg-white border border-gray-300 rounded-full flex items-center gap-2 hover:bg-gray-100"><SlidersHorizontal size={16} /> Filtros</button>
    </div>
    <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-full">
      <button onClick={() => setView("list")} className={cn("p-2 rounded-full transition-colors", view === "list" ? "bg-white shadow" : "text-gray-500")}><List size={16} /></button>
      <button onClick={() => setView("map")} className={cn("p-2 rounded-full transition-colors", view === "map" ? "bg-white shadow" : "text-gray-500")}><Map size={16} /></button>
    </div>
  </div>
);

const ClubCard = ({ club, onSlotClick }: { club: Club; onSlotClick: (slot: string) => void; }) => (
  <div className="group bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
    <Link href={`/courts/${club.id}`} className="block relative h-48 cursor-pointer">
      <Image
        src={club.imageUrl}
        alt={`Cancha de ${club.name}`}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
    </Link>
    <div className="p-4">
      <Link href={`/courts/${club.id}`}>
        <h3 className="font-bold text-lg text-foreground hover:text-brand-orange transition-colors">{club.name}</h3>
      </Link>
      <p className="text-sm text-paragraph flex items-center gap-1 mt-1"><MapPin size={14} /> {club.address}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {club.availableSlots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSlotClick(slot)}
            className="px-4 py-2 bg-brand-beige text-brand-dark font-semibold rounded-md text-sm hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded mt-2"></div>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="h-9 w-20 bg-gray-200 rounded-md"></div>
        <div className="h-9 w-20 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  </div>
);

// --- PÁGINA PRINCIPAL DE RESULTADOS ---
export default function SearchResultsPage() {
  const [view, setView] = useState<"list" | "map">("list");
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para manejar el modal de reserva
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ club: Club; time: string } | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSlotClick = (club: Club, time: string) => {
    setSelectedBooking({ club, time });
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="container mx-auto px-6 py-8">
          <div className="mb-8"><SearchBar /></div>
          <div className="mb-8"><FilterBar view={view} setView={setView} /></div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            {searchResults.length} clubes encontrados en Tostado, Santa Fe
          </h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {view === "list" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                    : searchResults.map((club) => (
                        <ClubCard 
                          key={club.id} 
                          club={club} 
                          onSlotClick={(time) => handleSlotClick(club, time)}
                        />
                      ))}
                </div>
              ) : (
                <div className="h-[60vh] bg-white rounded-xl shadow-md flex items-center justify-center text-paragraph">
                  <p>Vista de Mapa (Próximamente)</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>

      {/* Renderizamos el modal si hay una reserva seleccionada */}
      {selectedBooking && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          club={selectedBooking.club}
          court={{ id: 1, name: "Cancha Principal" }} // Dato de ejemplo
          time={selectedBooking.time}
          date={new Date()} // Dato de ejemplo
          price={selectedBooking.club.priceFrom} // Dato de ejemplo
        />
      )}
    </>
  );
}
