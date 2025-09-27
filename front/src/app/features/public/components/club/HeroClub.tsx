"use client"; // Necesario para usar hooks y animaciones de Framer Motion

import { routes } from "@/routes";
import { ButtonRipple } from "@/shared/components/ui/Buttons";
import Image from "next/image";
import React from "react";
import { easeOut, motion } from "framer-motion"; 

export const HeroClub = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, 
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 }, 
    visible: {
      opacity: 1,
      y: 0, 
      transition: {
        duration: 0.6,
        ease: easeOut,
      },
    },
  };

  return (
    <section className="min-h-[105vh] relative lg:grid lg:grid-cols-2 overflow-hidden">
      {/* Columna 1: Contenido de Texto */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center h-[90%] lg:text-left lg:items-start p-8 lg:p-16">
        {/* Contenedor animado para orquestar las animaciones de los hijos */}
        <motion.div
          className="max-w-xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={itemVariants}
            className="font-lora text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-6 text-foreground"
          >
            Automatiza tus reservas y maximiza tus ingresos.
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="font-satoshi text-lg md:text-xl text-paragraph mb-10"
          >
            CheCancha es la plataforma todo-en-uno que simplifica la gestión de
            tu complejo deportivo y te ayuda a aumentar tus ingresos. Menos
            administración, más crecimiento.
          </motion.p>
          <motion.div variants={itemVariants}>
            <ButtonRipple href={routes.public.inscripciones} className="z-30">
              Comienza ahora
            </ButtonRipple>
          </motion.div>
        </motion.div>
      </div>

      {/* Columna 2: Imagen (visible solo en pantallas grandes) */}
      <div className="hidden lg:block relative h-full">
        <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            className="w-full h-full"
        >
            <Image
                src="/bgmanagment.webp"
                alt="Jugadores de fútbol en acción"
                fill
                className="object-cover"
                priority
                sizes="50vw"
            />
        </motion.div>
      </div>

      {/* 2. SVG para la separación curvada */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-5 ">
        <svg
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+1.3px)] h-[150px]"
        >
          <path
            d="M0,60 C150,120 1050,120 1200,60 L1200,120 L0,120 Z"
            className="fill-foreground"
          ></path>
        </svg>
      </div>
    </section>
  );
};
