"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqData = [
  {
    question: "¿Cómo funciona el pago?",
    answer:
      "Podés pagar una seña online con Mercado Pago para asegurar tu reserva o elegir pagar el total en efectivo directamente en el club cuando llegues.",
  },
  {
    question: "¿Puedo cancelar una reserva?",
    answer:
      "Sí, cada complejo tiene su propia política de cancelación que podés revisar antes de confirmar tu reserva. Generalmente, se permite cancelar con hasta 24 horas de antelación.",
  },
  {
    question: "¿Qué pasa si llueve?",
    answer:
      "Para canchas al aire libre, la mayoría de los complejos te permitirán reprogramar tu partido sin costo adicional. Te recomendamos contactar directamente al club a través de la plataforma.",
  },
  {
    question: "¿Cómo se confirma mi reserva?",
    answer:
      "Una vez que completás la reserva, recibirás una confirmación instantánea en la app y un correo electrónico con todos los detalles, que podés agendar en tu calendario con un solo clic.",
  },
];

// Componente para cada item del acordeón
const AccordionItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      layout
      className="border-b border-neutral-400"
    >
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
            <h2 className="font-lora text-3xl md:text-5xl font-semibold text-foreground mt-2 mb-6">
              Preguntas Frecuentes
            </h2>
            <div className="bg-brand-green/20 p-6 rounded-xl">
              <h4 className="font-bold text-lg text-foreground">
                ¿No encontraste lo que buscabas?
              </h4>
              <p className="text-foreground/80 mt-2 mb-4">
                Nuestro equipo está aquí para ayudarte. Contactanos y resolvé
                todas tus dudas.
              </p>
              <a
                href="https://api.whatsapp.com/send?phone=TU_NUMERO_DE_WHATSAPP"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-brand-green text-white font-bold py-2 px-5 rounded-full hover:bg-opacity-90 transition-transform transform hover:scale-105"
              >
                Contactanos
              </a>
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
