"use client";

import "@/styles/day-picker.css";
import React, { useState } from "react";
import Image from "next/image";
import { getDay } from "date-fns";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { MapPin, Phone, Mail, Star, MessageSquare } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import { AmenityIcon } from "@/shared/components/ui/AmenityIcon";
import BookingModal from "@/app/features/public/components/courts/BookingModal";
import { BookingWidget } from "@/app/features/public/components/courts/BookingWidget";
import dynamic from "next/dynamic";
import type {
  ComplexProfileData,
  CourtWithPriceRules,
  PrismaImage,
  Schedule,
} from "@/app/(public)/canchas/[slug]/page";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ImageCarousel } from "./ImageCarousel";

// --- Carga dinámica del Mapa ---
const Map = dynamic(
  () => import("@/app/features/public/components/courts/Map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-200 rounded-2xl animate-pulse" />
    ),
  }
);

// --- Componentes Reutilizados ---

export const ComplexHeader = ({
  name,
  address,
  images,
}: {
  name: string;
  address: string;
  images: PrismaImage[];
}) => (
  <section className="relative mb-2 md:mb-12 rounded-2xl overflow-hidden h-52 md:h-80">
    <ImageCarousel images={images} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    <div className="absolute bottom-6 left-6 z-10">
      <h1
        className="text-4xl md:text-5xl font-bold text-white"
        style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.7)" }}
      >
        {name}
      </h1>
      <p
        className="text-lg text-gray-200 flex items-center gap-2 mt-1"
        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
      >
        <MapPin size={18} /> {address}
      </p>
    </div>
  </section>
);

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

const InfoItem = ({
  icon: Icon,
  text,
  href,
}: {
  icon: React.ElementType;
  text: string;
  href: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 text-paragraph hover:text-brand-orange transition-colors group"
  >
    <Icon
      size={18}
      className="text-gray-400 group-hover:text-brand-orange transition-colors"
    />
    <span className="font-medium">{text}</span>
  </a>
);

// --- COMPONENTE CLIENTE PRINCIPAL ---
export function ClientPage({ complex }: { complex: ComplexProfileData }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{
    court: CourtWithPriceRules;
    time: string;
  } | null>(null);

  const handleSlotClick = (court: CourtWithPriceRules, time: string) => {
    setSelectedBooking({ court, time });
    setIsModalOpen(true);
  };

  const weeklySchedule = generateWeeklySchedule(complex);
  const todayIndex = (getDay(new Date()) + 6) % 7;

  const hasContactInfo =
    complex.contactPhone ||
    complex.contactEmail ||
    complex.instagramHandle ||
    complex.facebookUrl;

  const primaryImage =
    complex.images.find((img) => img.isPrimary)?.url ||
    complex.images[0]?.url ||
    null;

  return (
    <>
      <div className="bg-background min-h-screen overflow-hidden">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 pb-8 pt-20">
          <ComplexHeader
            name={complex.name}
            address={complex.address}
            images={complex.images}
          />

          <div className="lg:flex lg:gap-8 lg:items-start">
            {/* --- COLUMNA PRINCIPAL (izquierda en desktop) --- */}
            {/* En móvil, esto ocupa todo el ancho. En desktop, 2/3 del espacio. */}
            <div className="lg:w-2/3 space-y-8">
              <BookingWidget
                club={complex}
                onSlotClick={handleSlotClick}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />

              {/* Movimos el Mapa aquí para que siga el flujo natural en móvil */}
              {complex.latitude && complex.longitude && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mt-8">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    Ubicación
                  </h3>
                  <div className="h-[400px] w-full rounded-lg overflow-hidden z-0">
                    <Map
                      lat={complex.latitude}
                      lng={complex.longitude}
                      complexName={complex.name}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* --- COLUMNA LATERAL (derecha en desktop) --- */}
            {/* En móvil, aparece debajo de la columna principal. En desktop, ocupa 1/3 y es pegajosa. */}
            {/* El 'mt-8 lg:mt-0' añade espacio en móvil, pero lo quita en desktop. */}
            <div className="lg:w-1/3 space-y-6 lg:sticky lg:top-24 mt-8 lg:mt-0">
              {/* Tarjeta de Contacto */}
              {hasContactInfo && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Contacto y Redes
                  </h3>
                  <div className="space-y-3">
                    {complex.contactPhone && (
                      <InfoItem
                        icon={Phone}
                        text={complex.contactPhone}
                        href={`tel:${complex.contactPhone}`}
                      />
                    )}
                    {complex.contactEmail && (
                      <InfoItem
                        icon={Mail}
                        text={complex.contactEmail}
                        href={`mailto:${complex.contactEmail}`}
                      />
                    )}
                    {complex.instagramHandle && (
                      <InfoItem
                        icon={FaInstagram}
                        text={`@${complex.instagramHandle}`}
                        href={`https://instagram.com/${complex.instagramHandle}`}
                      />
                    )}
                    {complex.facebookUrl && (
                      <InfoItem
                        icon={FaFacebook}
                        text="Facebook"
                        href={complex.facebookUrl}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Tarjeta de Servicios */}
              {complex.amenities && complex.amenities.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Servicios
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {complex.amenities.map((amenity) => (
                      <div
                        key={amenity.id}
                        className="flex items-center gap-2 text-paragraph"
                      >
                        <AmenityIcon
                          iconName={amenity.icon}
                          className="h-4 w-4 text-brand-secondary"
                        />
                        <span className="font-medium">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarjeta de Horarios */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Horarios
                </h3>
                <ul className="space-y-2 text-paragraph">
                  {weeklySchedule.map((item, index) => (
                    <li
                      key={item.day}
                      className={cn(
                        "flex justify-between",
                        index === todayIndex && "font-bold text-brand-orange"
                      )}
                    >
                      <span>{item.day}</span>
                      <span className="font-medium">{item.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {selectedBooking && complex && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          club={complex}
          court={selectedBooking.court}
          time={selectedBooking.time}
          date={selectedDate}
        />
      )}
    </>
  );
}
