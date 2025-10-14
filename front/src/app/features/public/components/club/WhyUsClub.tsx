"use client";
import React from "react";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, Banknote } from "lucide-react";

const benefits = [
  {
    icon: <Zap size={28} />,
    title: "Simpleza y Automatización",
    description:
      "Menos tiempo administrando, más tiempo haciendo crecer tu negocio. Tu calendario se llena solo.",
    color: "text-brand-orange",
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Reducción de Inasistencias",
    description:
      "Asegurá tus reservas con señas online y recordatorios automáticos que minimizan las canchas vacías.",
    color: "text-brand-orange",
  },
  {
    icon: <Banknote size={28} />,
    title: "Cobrá por Adelantado",
    description:
      "Ofrecé pagos online a través de Mercado Pago y olvidate de perseguir a los clientes para que te paguen.",
    color: "text-brand-orange",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const WhyUsClub = () => {
  return (
    <motion.section
      className="py-20 bg-brand-dark -mt-1"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      <div className="container mx-auto px-6 text-center">
        <motion.h2
          className="font-lora text-4xl md:text-5xl font-semibold text-background mb-16"
          variants={itemVariants}
        >
          ¿Por qué los complejos eligen CheCancha?
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              className="bg-black/20 p-6 rounded-lg text-left transition"
              variants={itemVariants}
            >
              <div className={`mb-4 ${benefit.color}`}>{benefit.icon}</div>
              <h3 className="text-xl font-bold text-background mb-2">
                {benefit.title}
              </h3>
              <p className="text-paragraph font-medium">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};
