"use client";

import "../../../../styles/day-picker.css";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  MapPin,
  Wifi,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import { cn } from "@/shared/lib/utils";
import { useParams } from "next/navigation";
import { BookingModal } from "@/shared/components/ui/BookingModal";
import type {
  Complex,
  Court,
  Image as PrismaImage,
  Schedule,
} from "@prisma/client";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, isToday, getDay } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

// --- TIPOS (Ahora coinciden con la respuesta de la API del backend) ---
type ComplexProfileData = Complex & {
  images: PrismaImage[];
  courts: (Court & {
    priceRules: {
      id: string;
      startTime: number;
      endTime: number;
      price: number;
      depositPercentage: number;
    }[];
  })[];
  schedule: Schedule | null;
};

type CourtAvailability = {
  courtId: string;
  available: boolean;
};
type ValidStartTime = {
  time: string;
  courts: CourtAvailability[];
};

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

// --- COMPONENTES DE LA PÁGINA ---
const ImageCarousel = ({ images }: { images: PrismaImage[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">No hay imágenes disponibles</p>
      </div>
    );
  }

  const prevSlide = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextSlide = () =>
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden">
      {images.map((image, index) => (
        <Image
          key={image.id}
          src={image.url}
          alt={`Imagen del complejo ${index + 1}`}
          fill
          className={`object-cover transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          priority={index === 0}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/40"
      >
        <ChevronLeft />
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/40"
      >
        <ChevronRight />
      </button>
    </div>
  );
};

const BookingWidget = ({
  club,
  onSlotClick,
  selectedDate,
  setSelectedDate,
}: {
  club: ComplexProfileData;
  onSlotClick: (
    court: Court & {
      priceRules: {
        id: string;
        startTime: number;
        endTime: number;
        price: number;
        depositPercentage: number;
      }[];
    },
    time: string
  ) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}) => {
  const [selectedCourt, setSelectedCourt] = useState<
    | (Court & {
        priceRules: {
          id: string;
          startTime: number;
          endTime: number;
          price: number;
          depositPercentage: number;
        }[];
      })
    | null
  >(club.courts[0] || null);
  const [validStartTimes, setValidStartTimes] = useState<ValidStartTime[]>([]);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);

  const isSelectedDateToday = isToday(selectedDate);
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  const isPast = (time: string) => {
    if (!isSelectedDateToday) return false;
    const [slotHour, slotMinute] = time.split(":").map(Number);
    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && slotMinute < currentMinute) return true;
    return false;
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!club.id || !selectedDate) return;
      setIsAvailabilityLoading(true);
      try {
        const dateString = format(selectedDate, "yyyy-MM-dd");
        const response = await fetch(
          `/api/complexes/public/${club.id}/availability?date=${dateString}`
        );
        if (!response.ok)
          throw new Error("No se pudo cargar la disponibilidad.");

        const data: ValidStartTime[] = await response.json();
        setValidStartTimes(data);
      } catch (error) {
        console.error("Failed to fetch availability", error);
        setValidStartTimes([]);
      } finally {
        setIsAvailabilityLoading(false);
      }
    };
    fetchAvailability();
  }, [club.id, selectedDate]);

  if (!selectedCourt) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center text-gray-500">
        Este complejo no tiene canchas configuradas.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Reservar un turno
      </h2>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-semibold text-paragraph mb-2 block">
            1. Elegí el día
          </label>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="border rounded-md p-2 bg-white"
            locale={es}
            disabled={{ before: new Date() }}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-paragraph mb-2 block">
            2. Elegí la cancha
          </label>
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
      </div>
      <div>
        <label className="text-sm font-semibold text-paragraph mb-2 block">
          3. Seleccioná un horario de inicio
        </label>
        {isAvailabilityLoading ? (
          <div className="h-40 flex items-center justify-center text-gray-500">
            Cargando disponibilidad...
          </div>
        ) : validStartTimes.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {validStartTimes.map((slot) => {
              const courtStatus = slot.courts.find(
                (c) => c.courtId === selectedCourt.id
              );
              const isAvailable = courtStatus?.available ?? false;
              const past = isPast(slot.time);

              return (
                <button
                  key={slot.time}
                  disabled={!isAvailable || past}
                  onClick={() => onSlotClick(selectedCourt, slot.time)}
                  className={cn(
                    "p-2 rounded-md text-center font-semibold transition-colors",
                    !isAvailable || past
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                      : "bg-neutral-200 text-neutral-700 hover:bg-brand-green hover:text-white cursor-pointer"
                  )}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No hay horarios disponibles para este día.
          </p>
        )}
      </div>
    </div>
  );
};

const PageSkeleton = () => (
  <div className="container mx-auto px-6 py-12 animate-pulse">
    <div className="max-w-7xl mx-auto">
      <div className="relative mb-8 h-64 md:h-96 rounded-2xl bg-gray-200"></div>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-gray-200 rounded-2xl h-96"></div>
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-200 rounded-2xl h-24"></div>
          <div className="bg-gray-200 rounded-2xl h-40"></div>
        </div>
      </div>
    </div>
  </div>
);

// --- PÁGINA DE PERFIL DEL CLUB ---
export default function ClubProfilePage() {
  const params = useParams();
  const clubId = params.id as string;
  const [club, setClub] = useState<ComplexProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{
    court: Court & {
      priceRules: {
        id: string;
        startTime: number;
        endTime: number;
        price: number;
        depositPercentage: number;
      }[];
    };
    time: string;
  } | null>(null);

  useEffect(() => {
    if (!clubId) return;

    const fetchClubProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/complexes/public/${clubId}`);
        if (!response.ok) {
          throw new Error("Club no encontrado o no disponible.");
        }
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
  }, [clubId]);

  const handleSlotClick = (
    court: Court & {
      priceRules: {
        id: string;
        startTime: number;
        endTime: number;
        price: number;
        depositPercentage: number;
      }[];
    },
    time: string
  ) => {
    setSelectedBooking({ court, time });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
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
              href="/courts"
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

  const weeklySchedule = club ? generateWeeklySchedule(club) : [];
  const todayIndex = (getDay(new Date()) + 6) % 7;
  const services = [
    "Wifi",
    "Vestuarios",
    "Estacionamiento",
    "Bar / Restaurante",
  ];

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
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Servicios Incluidos
                  </h3>
                  <ul className="grid grid-cols-2 gap-3 text-paragraph">
                    {services.map((service) => (
                      <li
                        key={service}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Wifi size={16} /> {service}
                      </li>
                    ))}
                  </ul>
                </div>
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
