"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CalendarCheck, Smartphone, CreditCard } from "lucide-react";

const steps = [
  {
    icon: <CalendarCheck size={28} />,
    title: "Buscá y Compará",
    text: "Filtrá por deporte, zona y horario. Encontrá la cancha perfecta y el mejor precio en segundos.",
  },
  {
    icon: <Smartphone size={28} />,
    title: "Reservá al Instante",
    text: "Mirá la disponibilidad en tiempo real y asegurá tu lugar con un clic. Tu partido se agenda automáticamente.",
  },
  {
    icon: <CreditCard size={28} />,
    title: "Pagá Como Quieras",
    text: "Aboná online con Mercado Pago para confirmar o elegí pagar directamente en el club cuando llegues.",
  },
];

const Step = ({
  icon,
  title,
  text,
  isLast,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  isLast: boolean;
}) => {
  const stepRef = useRef(null);
  return (
    <motion.div
      ref={stepRef}
      className="flex gap-6 relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
    >
      {/* Contenedor del ícono y la línea */}
      <div className="relative z-10">
        <div className="flex-shrink-0 bg-brand-orange text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_0_20px_rgba(255,78,2,0.7)]">
          {icon}
        </div>
        {/* Línea que conecta los íconos */}
        {!isLast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 h-[calc(100%_+_4rem)] w-0.5 bg-background" />
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-background/70 text-lg leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
};

export const BookingSection = () => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start center", "end end"],
  });

  // Mapeamos el progreso del scroll a la altura de la barra
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={targetRef} className="py-20 bg-foreground text-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto grid md:grid-cols-[auto,1fr] gap-x-12">
          {/* Columna de la Línea de Tiempo (oculta en móvil) */}
          <div className="relative hidden md:block">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1 bg-gray-200 rounded-full"></div>
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1 bg-brand-green rounded-full origin-top shadow-[0_0_20px_rgba(1,199,128,0.7)]"
              style={{ scaleY }}
            />
          </div>

          {/* Columna de Contenido */}
          <div className="space-y-16">
            <div className="text-center md:text-left">
              <h2 className="font-lora text-4xl md:text-5xl font-semibold mb-4">
                Reservar nunca fue tan fácil
              </h2>
              <p className="text-background/70 text-lg">
                Seguí estos simples pasos y preparate para jugar.
              </p>
            </div>
            {steps.map((step, index) => (
              <Step
                key={step.title}
                {...step}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
