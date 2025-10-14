"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import {
  ArrowRight,
  CalendarDays,
  BarChart3,
  Users,
  CreditCard,
} from "lucide-react";

// Datos para la lista de funcionalidades
const features = [
  {
    icon: <CalendarDays className="w-5 h-5 text-brand-secondary" />,
    text: "Gestión de Calendario Centralizada",
  },
  {
    icon: <CreditCard className="w-5 h-5 text-brand-secondary" />,
    text: "Control de Pagos y Señas Online",
  },
  {
    icon: <Users className="w-5 h-5 text-brand-secondary" />,
    text: "Base de Datos de Clientes",
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-brand-secondary" />,
    text: "Reportes de Ingresos y Ocupación",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

export const ManagmentClub = () => {
  return (
    <motion.section
      className="py-20 bg-background"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ visible: { transition: { duration: 0.5 } } }}
    >
      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Columna de Imagen */}
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Image
            src="/dashboard2.png"
            alt="Vista previa del dashboard de CheCancha"
            width={900}
            height={600}
            className="rounded-xl shadow-xl"
          />
        </motion.div>

        <motion.div variants={containerVariants}>
          <motion.h2
            className="font-lora text-4xl md:text-5xl font-semibold text-foreground mb-6"
            variants={itemVariants}
          >
            Control total de tu negocio desde un solo lugar.
          </motion.h2>
          <motion.p
            className="text-lg text-paragraph font-medium mb-8 leading-relaxed"
            variants={itemVariants}
          >
            Nuestra plataforma te brinda todas las herramientas que necesitás
            para optimizar tu operación, entender a tus clientes y tomar
            decisiones basadas en datos reales.
          </motion.p>

          <motion.ul className="space-y-4 mb-10" variants={containerVariants}>
            {features.map((feature) => (
              <motion.li
                key={feature.text}
                className="flex items-center gap-4"
                variants={itemVariants}
              >
                {feature.icon}
                <span className="font-medium text-paragraph leading-relaxed">
                  {feature.text}
                </span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div variants={itemVariants}>
            <ButtonPrimary href="#pricing" icon={<ArrowRight size={20} />}>
              Ver Planes y Precios
            </ButtonPrimary>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};
