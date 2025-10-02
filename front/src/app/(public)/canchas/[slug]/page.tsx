"use client";

import "../../../../styles/day-picker.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, AlertCircle } from "lucide-react";
import { getDay } from "date-fns";
import { cn } from "@/shared/lib/utils";

// --- Tipos ---
import type { Amenity, Complex, Court, Image as PrismaImage, Schedule } from "@prisma/client";
import { AmenityIcon } from "@/shared/components/ui/AmenityIcon";
export type PriceRule = { id: string; startTime: number; endTime: number; price: number; depositAmount: number; };
export type CourtWithPriceRules = Court & { priceRules: PriceRule[] };


export type ComplexProfileData = Complex & {
  images: PrismaImage[];
  courts: CourtWithPriceRules[];
  schedule: Schedule | null;
  amenities: Amenity[];
  cancellationPolicyHours: number; // Campo añadido
};
export type ValidStartTime = { time: string; courts: { courtId: string; available: boolean }[] };


// --- Componentes ---
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import BookingModal from "@/shared/components/ui/BookingModal";
import { ImageCarousel } from "@/app/features/public/components/courts/ImageCarousel";
import { BookingWidget } from "@/app/features/public/components/courts/BookingWidget";
import { PageSkeleton } from "@/app/features/public/components/courts/Skeleton";
import { routes } from "@/routes";

// --- Funciones Helper ---
const generateWeeklySchedule = (complex: ComplexProfileData) => {
  const schedule = [];
  const dayOrder: {
    name: string;
    openKey: keyof Schedule;
    closeKey: keyof Schedule;
  }[] = [
    { name: "Lunes", openKey: "mondayOpen", closeKey: "mondayClose" },
    { name: "Martes", openKey: "tuesdayOpen", closeKey: "tuesdayClose" },
    { name: "Miércoles", openKey: "wednesdayOpen", closeKey: "wednesdayClose" },
    { name: "Jueves", openKey: "thursdayOpen", closeKey: "thursdayClose" },
    { name: "Viernes", openKey: "fridayOpen", closeKey: "fridayClose" },
    { name: "Sábado", openKey: "saturdayOpen", closeKey: "saturdayClose" },
    { name: "Domingo", openKey: "sundayOpen", closeKey: "sundayClose" },
  ];

  for (const day of dayOrder) {
    const specificOpenHour = complex.schedule?.[day.openKey] as number | null;
    const specificCloseHour = complex.schedule?.[day.closeKey] as number | null;
    const openHour = specificOpenHour ?? complex.openHour;
    const closeHour = specificCloseHour ?? complex.closeHour;

    let hoursString = "Cerrado";
    if (typeof openHour === "number" && typeof closeHour === "number") {
      hoursString = `${String(openHour).padStart(2, "0")}:00 - ${String(
        closeHour
      ).padStart(2, "0")}:00`;
    }
    schedule.push({ day: day.name, hours: hoursString });
  }
  return schedule;
};

// --- PÁGINA DE PERFIL DEL CLUB ---
export default function ClubProfilePage() {
  const params = useParams();
  const clubSlug = params.slug as string;

  const [club, setClub] = useState<ComplexProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{
    court: CourtWithPriceRules;
    time: string;
  } | null>(null);

  useEffect(() => {
    if (!clubSlug) return;
    const fetchClubProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/complexes/public/${clubSlug}`);
        if (!response.ok)
          throw new Error("Club no encontrado o no disponible.");
        const data = await response.json();
        setClub(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ocurrió un error inesperado."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchClubProfile();
  }, [clubSlug]);

  const handleSlotClick = (court: CourtWithPriceRules, time: string) => {
    setSelectedBooking({ court, time });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex flex-col">
        <Navbar />
        <PageSkeleton />
        <Footer />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="bg-background min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-center px-4">
          <div>
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {error || "Club no encontrado"}
            </h2>
            <p className="mt-2 text-paragraph">
              El club que buscas no existe o no está disponible en este momento.
            </p>
            <Link
              href={routes.public.canchas}
              className="mt-6 inline-block bg-brand-orange text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
            >
              Volver al listado
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const weeklySchedule = generateWeeklySchedule(club);
  const todayIndex = (getDay(new Date()) + 6) % 7;

  return (
    <>
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <section className="relative mb-8">
              <ImageCarousel images={club.images} />
              <div className="absolute bottom-6 left-6 z-10">
                <h1
                  className="text-4xl md:text-5xl font-bold text-white"
                  style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.7)" }}
                >
                  {club.name}
                </h1>
                <p
                  className="text-lg text-gray-200 flex items-center gap-2 mt-1"
                  style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                >
                  <MapPin size={18} /> {club.address}, {club.city}
                </p>
              </div>
            </section>
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <BookingWidget
                  club={club}
                  onSlotClick={handleSlotClick}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Horarios del Club
                  </h3>
                  <ul className="space-y-2 text-paragraph">
                    {weeklySchedule.map((item, index) => (
                      <li
                        key={item.day}
                        className={cn(
                          "flex justify-between text-sm",
                          index === todayIndex && "font-bold text-brand-orange"
                        )}
                      >
                        <span>{item.day}</span>
                        <span>{item.hours}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                
                  {club.amenities.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Servicios Incluidos
                      </h3>
                      <ul className="grid grid-cols-2 gap-3 text-paragraph">
                        {club.amenities.map((amenity) => (
                          <li
                            key={amenity.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <AmenityIcon
                              iconName={amenity.icon}
                              className="h-4 w-4 text-brand-orange"
                            />
                            {amenity.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </main>
        <Footer />
      </div>

      {selectedBooking && club && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          club={club}
          court={selectedBooking.court}
          time={selectedBooking.time}
          date={selectedDate}
        />
      )}
    </>
  );
}