"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const faqData = [
  {
    question: "¿Cómo funciona el pago?",
    answer:
      "Podés pagar una seña online a través de Mercado Pago. Una vez realizado el pago: Tu turno queda reservado automáticamente, y recibiras una confirmación por email.",
  },
  {
    question: "¿Puedo cancelar una reserva?",
    answer:
      "No se puede cancelar desde la web. Cada complejo tiene su política, pero normalmente: Cancelación hasta 24 horas antes del turno. Consultá con el club si necesitás reprogramar.",
  },
  {
    question: "¿Qué pasa si llueve?",
    answer:
      "Para canchas al aire libre: La mayoría permite reprogramar tu partido sin costo. Contactá al club a través de la plataforma para coordinar un nuevo horario.",
  },
  {
    question: "¿Cómo se confirma mi reserva?",
    answer:
      "Para confirmar tu reserva: 1. Elegí el complejo. 2. Seleccioná día y hora. 3. Pagá la seña online. 4. Recibí confirmación por email.",
  },
  {
    question: "¿Puedo reservar más de una cancha a la vez?",
    answer:
      "Si! Depende del complejo y su plan activo: Algunos permiten múltiples canchas por turno. Otros limitan a una cancha por reserva.",
  },
  {
    question: "¿Hay descuentos o promociones?",
    answer:
      "Algunos complejos ofrecen cupones o promociones especiales: Proximamente podras verlo en su muro. Aplicará según disponibilidad y reglas del club.",
  },
];


const AccordionItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div layout className="border-b border-neutral-400">
      <motion.button
        className="w-full flex justify-between items-center text-left py-4 px-5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-foreground">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-neutral-500" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-lg text-neutral-500">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FaqSection = () => {
  return (
    <motion.section
      className="py-20 bg-background min-h-screen flex justify-center items-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-7xl min-h-[90%] mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 items-start">
          {/* Columna Izquierda: Título y CTA */}
          <div className="md:col-span-1">
            <h2 className="font-lora text-3xl md:text-5xl font-semibold text-brand-dark mt-2 mb-6">
              Preguntas Frecuentes
            </h2>
            <div className="bg-brand-secondary p-3 md:p-6 rounded-xl">
              <h4 className="font-bold text-lg text-brand-dark">
                ¿No encontraste lo que buscabas?
              </h4>
              <p className="text-pragraph mt-2 mb-4">
                Nuestro equipo está aquí para ayudarte. Contactanos y resolvé
                todas tus dudas.
              </p>
              <Link
                href="https://api.whatsapp.com/send?phone=5491154702118"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-brand-dark text-background font-medium py-3 px-4 rounded-full transition-transform"
              >
                Contáctanos 
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Acordeón de Preguntas */}
          <div className="md:col-span-2 space-y-2">
            {faqData.map((item) => (
              <AccordionItem key={item.question} {...item} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};
