"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import {
  BarChart3,
  CreditCard,
  Sparkles,
  Settings2,
  CalendarCheck2,
  Users,
  Phone,
  X,
  LucideIcon,
} from "lucide-react";
import Footer from "@/shared/components/Footer";
import Navbar from "@/shared/components/Navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Definición de Tipos ---
interface Faq {
  q: string;
  a: string;
  link?: {
    url: string;
    text: string;
  };
}

interface SupportCategory {
  id: string;
  title: string;
  loomEmbedUrl?: string;
  icon: LucideIcon;
  description: string;
  isComingSoon: boolean;
  faqs: Faq[];
}

// --- Define el contenido de soporte ---
const supportCategories: SupportCategory[] = [
  {
    id: "getting-started",
    title: "Primeros Pasos",
    loomEmbedUrl: "https://www.loom.com/embed/d55cdac7ae9a48538f309b22f0a83576",
    icon: Settings2,
    description:
      "Configurá tu complejo para empezar a recibir reservas online.",
    isComingSoon: false,
    faqs: [
      {
        q: "¿Cómo configuro mis canchas?",
        a: 'Ve a Configuración > Canchas > "Nueva Cancha".',
      },
      {
        q: "¿Cómo establezco mis horarios?",
        a: "En Configuración > Horario, definí tus horas de apertura y cierre por día.",
      },
      {
        q: "¿Cómo defino mis precios?",
        a: 'Edita cada cancha en Configuración > Canchas y ve a "Reglas de Precio".',
      },
      {
        q: "¿Cómo conecto Mercado Pago?",
        a: "En Configuración > Pagos, seguí los pasos para vincular tu cuenta.",
      },
      {
        q: "¿Cómo hago para que mi club aparezca en el mapa?",
        a: "Ve a Mi Panel > Configuración > Información Básica > Colocá la Latitud y Longitud que te brinda Google Maps.",
        link: {
          url: "https://www.loom.com/embed/5d95d66f1c614697b258ca3c3e30682a",
          text: "(Ver tutorial)",
        },
      },
    ],
  },
  {
    id: "bookings",
    title: "Gestión de Reservas",
    loomEmbedUrl: "https://www.loom.com/embed/358054dacda34ec9bb2d7a251edd41b8",
    icon: CalendarCheck2,
    description:
      "Manejá tu calendario, creá reservas manuales y gestioná cancelaciones.",
    isComingSoon: false,
    faqs: [
      {
        q: "¿Cómo creo una reserva manual?",
        a: "En la pestaña Reservas, hacé clic en el horario/cancha libre y completá los datos.",
      },
      {
        q: "¿Cómo veo la semana completa?",
        a: 'En Reservas, usá el botón "Semana".',
      },
      {
        q: "¿Cómo cancelo una reserva?",
        a: 'Clickeá la reserva en el calendario y usá el botón "Cancelar" en el detalle.',
      },
      {
        q: "¿Cómo sé si una reserva está confirmada?",
        a: 'Aparecen en verde (o un color distintivo) y dicen "Confirmado".',
      },
    ],
  },
  {
    id: "complex-profile",
    title: "Jugadores",
    loomEmbedUrl: "https://www.loom.com/embed/1e9e5377f9a04cd49c1c613d35870792",
    icon: Users,
    description: "Nunca fué tan fácil reservar una cancha.",
    isComingSoon: false,
    faqs: [
      {
        q: "¿Cómo reservo una cancha?",
        a: "En Inicio > Click en Buscar > Seleccionar Cancha, dia y horario > Reservar.",
      },
      {
        q: "¿Puedo Cancelar un turno?",
        a: "Si podes! En Mis Reservas > Seleccionar Reserva > Cancelar Turno.",
      },
      {
        q: "No estoy registrado y quiero reservar un turno ¿Puedo?",
        a: "Si, desde CheCancha pensamos en la simplicidad para ustedes. Cuando vayas a reservar se te va a pedir tu nombre y numero de telefono.",
      },
      {
        q: "¿Porque no me llegan las notificaciones?",
        a: "Es muy importante para que te lleguen las notificaciones que vayas a tu perfil y actives las notificaciones haciendo click en activar.",
      },
    ],
  },
  {
    id: "payments-subscription",
    title: "Pagos y Suscripción",
    icon: CreditCard,
    description:
      "Entendé cómo funciona la prueba gratuita y la suscripción a Che Cancha.",
    isComingSoon: false,
    faqs: [
      {
        q: "¿Cómo funcionan los 90 días de prueba?",
        a: "Tenés acceso completo al mejor plan posible con oportunidad de concer las ultimas novedades!. Te contactaremos antes de que termine.",
      },
      {
        q: "¿Cómo se paga la suscripción?",
        a: "Se gestionará vía Mercado Pago (recurrente) o transferencia.",
      },
      {
        q: "¿Qué pasa si mi pago se retrasa?",
        a: 'Tu cuenta pasará a "Atrasada" con un período de gracia.',
      },
    ],
  },
  {
    id: "reports",
    title: "Reportes y Finanzas",
    icon: BarChart3,
    description: "Visualizá el rendimiento de tu negocio (caja, stock).",
    isComingSoon: true,
    faqs: [],
  },
  {
    id: "community-features",
    title: "Comunidad y Torneos",
    icon: Users,
    description: "Aprendé a usar el Muro Social y el Gestor de Torneos.",
    isComingSoon: true,
    faqs: [],
  },
];

const SupportPage = () => {
  const whatsappNumber = "5491154702118";
  const whatsappMessage = "Hola! Tengo una duda sobre mi complejo deportivo.";

  // --- Estado para el Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const handleOpenVideoModal = (url: string) => {
    setSelectedVideoUrl(url);
    setIsModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsModalOpen(false);
    setSelectedVideoUrl(null);
  };

  return (
    <>
      <Navbar />

      <div className="relative bg-[url('/bannerfq.png')] bg-cover bg-top bg-no-repeat text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative container mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                Estamos aquí para ayudarte
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Centro de Ayuda
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-8">
              Encontrá respuestas rápidas a tus preguntas
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-2">
            Centro de Ayuda
          </h1>
          <p className="text-lg text-paragraph">
            Encontrá respuestas rápidas a tus preguntas frecuentes.
          </p>
        </header>

        {/* --- Tarjetas de Categorías --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {supportCategories.map((category: SupportCategory) => (
            <Card
              key={category.id}
              className={cn(
                "flex flex-col transition-all hover:shadow-md",
                category.isComingSoon &&
                  "opacity-50 cursor-not-allowed bg-gray-50"
              )}
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    !category.isComingSoon && "bg-brand-orange/10"
                  )}
                >
                  <category.icon
                    className={cn(
                      "w-6 h-6",
                      category.isComingSoon
                        ? "text-gray-400"
                        : "text-brand-orange"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    {category.loomEmbedUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenVideoModal(category.loomEmbedUrl as string);
                        }}
                        className="text-sm text-brand-orange hover:underline font-semibold ml-2 whitespace-nowrap cursor-pointer"
                      >
                        (Ver Tutorial)
                      </button>
                    )}
                  </div>
                  <CardDescription className="text-sm mt-1">
                    {category.description}
                  </CardDescription>
                  {category.isComingSoon && (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full mt-2 inline-block">
                      Próximamente
                    </span>
                  )}
                </div>
              </CardHeader>
              {!category.isComingSoon && category.faqs.length > 0 && (
                <CardContent className="pt-0 flex-grow">
                  <Accordion type="single" collapsible className="w-full">
                    {category.faqs.map((faq: Faq, index: number) => (
                      <AccordionItem
                        value={`item-${category.id}-${index}`}
                        key={index}
                      >
                        <AccordionTrigger className="text-left text-sm font-medium hover:no-underline px-1 py-3">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-700 pb-3 px-1">
                          {/* 3. Lógica de renderizado actualizada */}
                          <p className="inline">{faq.a}</p>
                          {faq.link && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenVideoModal(
                                  category.loomEmbedUrl as string
                                );
                              }}
                              className="text-sm text-brand-orange hover:underline font-semibold ml-2 whitespace-nowrap cursor-pointer"
                            >
                              {faq.link.text}
                            </button>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* --- Sección de Contacto --- */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold text-brand-dark mb-4">
            ¿Necesitás más ayuda?
          </h2>
          <p className="text-paragraph mb-6 max-w-xl mx-auto">
            Si no encontraste tu respuesta, contactanos directamente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                whatsappMessage
              )}`}
              className="flex items-center text-white font-medium px-4 py-2 bg-[#24d367] rounded-full hover:bg-brand-dark transition-colors duration-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone className="inline-block w-4 h-4 mr-2" /> Soporte
            </Link>
          </div>
        </section>
      </div>

      <Footer />

      {/* --- Render del Modal --- */}
      <VideoModal
        isOpen={isModalOpen}
        onClose={handleCloseVideoModal}
        videoUrl={selectedVideoUrl}
      />
    </>
  );
};

export default SupportPage;

// --- Componente Modal de Video ---
interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
}

const VideoModal = ({ isOpen, onClose, videoUrl }: VideoModalProps) => {
  if (!videoUrl) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-1.5 shadow-lg text-gray-600 hover:bg-error hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <X size={24} />
            </button>
            {/* Contenedor responsivo para el video */}
            <div className="overflow-hidden rounded-lg">
              <div
                style={{
                  position: "relative",
                  paddingBottom: "56.25%",
                  height: 0,
                }}
              >
                <iframe
                  src={videoUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                ></iframe>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
