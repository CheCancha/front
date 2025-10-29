import React from "react";
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
} from "lucide-react";
import Footer from "@/shared/components/Footer";
import Navbar from "@/shared/components/Navbar";
import { cn } from "@/lib/utils";

// --- Define el contenido de soporte ---
const supportCategories = [
  {
    id: "getting-started",
    title: "Primeros Pasos",
    icon: Settings2,
    description:
      "Configurá tu complejo para empezar a recibir reservas online.",
    isComingSoon: false,
    faqs: [
      {
        q: "¿Cómo configuro mis canchas?",
        a: 'Ve a Configuración > Canchas > "Nueva Cancha". [Ver Tutorial - Próximamente]',
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
        a: "En Configuración > Pagos, seguí los pasos para vincular tu cuenta. [Ver Guía - Próximamente]",
      },
    ],
  },
  {
    id: "bookings",
    title: "Gestión de Reservas",
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
    title: "Perfil y Configuración del Club",
    icon: Settings2,
    description:
      "Actualizá la info pública, fotos, servicios y políticas de tu complejo.",
    isComingSoon: false,
    faqs: [
      { q: "¿Cómo cambio fotos?", a: "En Configuración > Imágenes." },
      {
        q: "¿Cómo actualizo mi teléfono/redes?",
        a: "En Configuración > General.",
      },
      {
        q: "¿Cómo añado servicios (parrilla, etc.)?",
        a: "En Configuración > General > Servicios.",
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
        a: "Tenés acceso completo al plan elegido. Te contactaremos antes de que termine.",
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

  return (
    <>
      <Navbar />

      {/* Hero Section con gradiente */}
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
          {supportCategories.map((category) => (
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
                  <CardTitle className="text-lg">{category.title}</CardTitle>
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
              {/* Mostrar FAQs solo si no es 'Próximamente' */}
              {!category.isComingSoon && category.faqs.length > 0 && (
                <CardContent className="pt-0 flex-grow">
                  <Accordion type="single" collapsible className="w-full">
                    {category.faqs.map((faq, index) => (
                      <AccordionItem
                        value={`item-${category.id}-${index}`}
                        key={index}
                      >
                        <AccordionTrigger className="text-left text-sm font-medium hover:no-underline px-1 py-3">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-700 pb-3 px-1">
                          {faq.a}
                          {/* Enlace opcional a video */}
                          {faq.a.includes("[Ver") && (
                            <Link
                              href="#"
                              className="text-brand-orange hover:underline ml-1"
                            >
                              (Ver)
                            </Link>
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

        {/* --- Sección de Contacto (sin cambios) --- */}
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
    </>
  );
};

export default SupportPage;
