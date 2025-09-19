"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  ArrowDownUp,
  SlidersHorizontal,
  List,
  Map,
  Clock,
} from "lucide-react";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/shared/components/ui/Searchbar";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Spinner } from "@/shared/components/ui/Spinner";

// --- TIPOS (Actualizados para coincidir con la nueva respuesta de la API) ---
type Club = {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  availableSlots: string[];
};

// --- COMPONENTES REUTILIZABLES ---
const FilterBar = ({
  view,
  setView,
}: {
  view: "list" | "map";
  setView: (v: "list" | "map") => void;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
    <div className="flex items-center gap-2">
      <button className="px-4 py-2 bg-white border border-gray-300 rounded-full flex items-center gap-2 hover:bg-gray-100">
        <ArrowDownUp size={16} /> Ordenar
      </button>
      <button className="px-4 py-2 bg-white border border-gray-300 rounded-full flex items-center gap-2 hover:bg-gray-100">
        <SlidersHorizontal size={16} /> Filtros
      </button>
    </div>
    <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-full">
      <button
        onClick={() => setView("list")}
        className={cn(
          "p-2 rounded-full transition-colors",
          view === "list" ? "bg-white shadow" : "text-gray-500"
        )}
      >
        <List size={16} />
      </button>
      <button
        onClick={() => setView("map")}
        className={cn(
          "p-2 rounded-full transition-colors",
          view === "map" ? "bg-white shadow" : "text-gray-500"
        )}
      >
        <Map size={16} />
      </button>
    </div>
  </div>
);

const ClubCard = ({ club }: { club: Club }) => (
  <Link href={`/courts/${club.id}`} className="block">
    <div className="group bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
      <div className="block relative h-48 cursor-pointer">
        <Image
          src={club.imageUrl}
          alt={`Cancha de ${club.name}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-foreground hover:text-brand-orange transition-colors">
          {club.name}
        </h3>
        <p className="text-sm text-paragraph flex items-center gap-1 mt-1">
          <MapPin size={14} /> {club.address}
        </p>

        {/* --- NUEVA SECCIÓN DE TURNOS DISPONIBLES --- */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex-grow flex flex-col justify-end">
          {club.availableSlots.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Próximos turnos hoy:
              </p>
              <div className="flex flex-wrap gap-2">
                {club.availableSlots.map((slot) => (
                  <div
                    key={slot}
                    className="px-3 py-1 bg-green-100 text-green-800 font-bold rounded-md text-sm"
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>No hay turnos disponibles hoy</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </Link>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded mt-2"></div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
        <div className="flex flex-wrap gap-2">
          <div className="h-7 w-16 bg-gray-200 rounded-md"></div>
          <div className="h-7 w-16 bg-gray-200 rounded-md"></div>
          <div className="h-7 w-16 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  </div>
);

const SearchResultsComponent = () => {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"list" | "map">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [complexes, setComplexes] = useState<Club[]>([]);

  const city = searchParams.get("city");

  useEffect(() => {
    const fetchComplexes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?${searchParams.toString()}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "No se pudieron cargar los complejos.");
        }
        const data = await response.json();
        setComplexes(data);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error desconocido"
        );
        setComplexes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplexes();
  }, [searchParams]);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <SearchBar />
        </div>
        <div className="mb-8">
          <FilterBar view={view} setView={setView} />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          {isLoading
            ? "Buscando complejos..."
            : `${complexes.length} clubes encontrados ${
                city ? `en ${city}` : ""
              }`}
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
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                ) : complexes.length > 0 ? (
                  complexes.map((club) => (
                    <ClubCard key={club.id} club={club} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-paragraph">
                    <p className="font-semibold">
                      No se encontraron resultados
                    </p>
                    <p className="text-sm">
                      Intentá ajustar los filtros o buscá en otra ciudad.
                    </p>
                  </div>
                )}
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
  );
};

// --- PÁGINA PRINCIPAL DE RESULTADOS ---
export default function SearchResultsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <Spinner />
        </div>
      }
    >
      <SearchResultsComponent />
    </Suspense>
  );
}
