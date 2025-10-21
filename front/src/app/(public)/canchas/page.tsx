"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, List, Map, Clock, Star } from "lucide-react";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { SearchBar } from "@/shared/components/ui/Searchbar";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import { Spinner } from "@/shared/components/ui/Spinner";
import BookingModal from "@/app/features/public/components/courts/BookingModal";
import { routes } from "@/routes";
import dynamic from "next/dynamic";
import { format } from "date-fns";

// --- TIPOS DE DATOS ---
export type Club = {
  id: string;
  slug: string;
  name: string;
  address: string;
  imageUrl: string;
  availableSlots: AvailableSlot[];
  cancellationPolicyHours: number;
  latitude: number | null;
  longitude: number | null;
  averageRating: number;
  reviewCount: number;  
};

type PriceRule = {
  id: string;
  startTime: number;
  endTime: number;
  price: number;
  depositAmount: number;
};

type CourtInfo = {
  id: string;
  name: string;
  slotDurationMinutes: number;
  priceRules: PriceRule[];
};

type AvailableSlot = {
  time: string;
  court: CourtInfo;
};

type BookingSelection = {
  club: Club;
  court: CourtInfo;
  time: string;
  date: Date;
};

// --- COMPONENTES DE LA INTERFAZ ---
const FilterBar = ({
  view,
  setView,
}: {
  view: "list" | "map";
  setView: (v: "list" | "map") => void;
}) => (
  <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-full w-fit">
    <button
      onClick={() => setView("list")}
      className={cn(
        "p-2 rounded-full transition-colors",
        view === "list" ? "bg-[#f8f9f9] shadow" : "text-gray-500"
      )}
      aria-label="Vista de lista"
    >
      <List size={16} />
    </button>
    <button
      onClick={() => setView("map")}
      className={cn(
        "p-2 rounded-full transition-colors",
        view === "map" ? "bg-[#f8f9f9] shadow" : "text-gray-500"
      )}
      aria-label="Vista de mapa"
    >
      <Map size={16} />
    </button>
  </div>
);

const ClubCard = ({
  club,
  onBookSlot,
}: {
  club: Club;
  onBookSlot: (slot: AvailableSlot) => void;
}) => {
  const handleSlotClick = (e: React.MouseEvent, slot: AvailableSlot) => {
    e.preventDefault();
    e.stopPropagation();
    onBookSlot(slot);
  };

  return (
    <div className="group bg-[#f8f9f9] rounded-xl border overflow-hidden transition-all duration-300 flex flex-col h-full">
      <Link
        href={routes.public.complexProfile(club.slug)}
        className="block relative h-48"
      >
        <Image
          src={club.imageUrl}
          alt={`Imagen de ${club.name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <Link href={routes.public.complexProfile(club.slug)}>
          <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-lg text-foreground truncate" title={club.name}>
              {club.name.trim()}
          </h3>
              {club.reviewCount > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-sm text-gray-800">{club.averageRating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({club.reviewCount})</span>
              </div>
            )}
          </div></Link>
          <p className="text-sm text-paragraph flex items-center gap-1.5 my-1">
          <MapPin size={14}/>{club.address.trim()}
          </p>
          <div className="pt-4 border-t border-gray-200 flex-grow flex flex-col justify-end">
          {club.availableSlots.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2 justify-center">
                {club.availableSlots.map((slot) => (
                  <button
                    key={`${slot.time}-${slot.court.id}`}
                    onClick={(e) => handleSlotClick(e, slot)}
                    className="px-4 py-2 bg-white text-brand-dark font-bold rounded-md text-sm transition-colors hover:bg-brand-secondary cursor-pointer"
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>No hay turnos para la fecha</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-[#f8f9f9] rounded-xl shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-4">
      <div className="h-6 w-3/4 bg-gray-200 rounded" />
      <div className="h-4 w-1/2 bg-gray-200 rounded mt-2" />
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          <div className="h-7 w-16 bg-gray-200 rounded-md" />
          <div className="h-7 w-16 bg-gray-200 rounded-md" />
          <div className="h-7 w-16 bg-gray-200 rounded-md" />
        </div>
      </div>
    </div>
  </div>
);

const ComplexesMap = dynamic(
  () =>
    import("@/app/features/public/components/courts/MapView").then(
      (mod) => mod.ComplexesMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[60vh] bg-gray-200 rounded-xl animate-pulse" />
    ),
  }
);

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
const SearchResultsComponent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [view, setView] = useState<"list" | "map">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [complexes, setComplexes] = useState<Club[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingSelection | null>(null);

  useEffect(() => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    let needsRedirect = false;

    if (!currentParams.has("date")) {
      currentParams.set("date", format(new Date(), "yyyy-MM-dd"));
      needsRedirect = true;
    }
    

    if (needsRedirect) {
      router.replace(`${pathname}?${currentParams.toString()}`);
    }
  }, [searchParams, router, pathname]);
  
  const dateParam = searchParams.get("date");
  const searchDate = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();

  useEffect(() => {
    if (!dateParam) {
      setIsLoading(true);
      return;
    }

    const fetchComplexes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?${searchParams.toString()}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "No se pudieron cargar los complejos."
          );
        }
        const data = await response.json();
        setComplexes(data);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado."
        );
        setComplexes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplexes();
  }, [searchParams, dateParam]);

  const handleBookSlot = (club: Club, slot: AvailableSlot) => {
    setSelectedBooking({
      club: club,
      court: slot.court,
      time: slot.time,
      date: searchDate,
    });
    setIsModalOpen(true);
  };

  const handleMarkerClick = (club: Club) => {
    router.push(routes.public.complexProfile(club.slug));
  };

  if (!dateParam) {
     return (
       <>
         <Navbar />
         <main className="container mx-auto px-6 py-24 flex-grow">
           <div className="bg- border border-gray-200 rounded-xl p-6 mb-8">
             <h2 className="text-xl font-bold text-foreground mb-4">
               Buscá tu cancha
             </h2>
             <SearchBar />
           </div>
           
         </main>
         <Footer />
       </>
     );
  }

  return (
    <>
      <div className="bg-[#f0f0ef] min-h-screen flex flex-col">
        <Navbar />

        <main className="container mx-auto px-6 py-24 flex-grow">
          <div className="bg-[#f8f9f9] border border-gray-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Buscá tu cancha
            </h2>
            <SearchBar />
            <hr className="my-6 border-gray-200" />
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-8 md:col-span-10">
                <h3 className="text-lg font-medium text-paragraph">
                  {isLoading
                    ? "Buscando complejos..."
                    : `${complexes.length} clubes encontrados`}
                </h3>
              </div>
              <div className="col-span-4 md:col-span-2 flex justify-end">
                <FilterBar view={view} setView={setView} />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {view === "list" ? (
                isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : complexes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {complexes.map((club) => (
                      <ClubCard
                        key={club.id}
                        club={club}
                        onBookSlot={(slot) => handleBookSlot(club, slot)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="col-span-full text-center py-12 text-paragraph bg-[#f8f9f9] border border-gray-200 rounded-xl">
                    <p className="font-semibold">
                      No se encontraron resultados
                    </p>
                    <p className="text-sm">
                      Intentá ajustar los filtros o buscá en otra ciudad.
                    </p>
                  </div>
                )
              ) : (
                <ComplexesMap
                  complexes={complexes}
                  onMarkerClick={handleMarkerClick}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>

      {selectedBooking && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          club={selectedBooking.club}
          court={selectedBooking.court}
          time={selectedBooking.time}
          date={selectedBooking.date}
        />
      )}
    </>
  );
};

export default function SearchResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <SearchResultsComponent />
    </Suspense>
  );
}

