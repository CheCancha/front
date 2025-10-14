"use client";

import type { FC } from "react";
import Image from "next/image";
import { SearchBar } from "@/shared/components/ui/Searchbar";
import { motion, easeOut } from "framer-motion";

const HeroSection: FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: easeOut },
    },
  };

  return (
    // Se ajusta el padding inferior para dar espacio a la searchbar en móvil
    <section className="relative w-full pb-8" id="inicio">
      <div className="relative w-full mx-auto">
        {/* Contenedor para la imagen de fondo y el texto */}
        <div className="relative h-[60vh] min-h-[450px] lg:h-[70dvh] rounded-b-3xl overflow-hidden flex flex-col items-center justify-center text-center text-white p-4">
          <Image
            src="/paddle.webp"
            alt="Jugadores de pádel en acción"
            fill
            className="object-cover z-0"
            priority
            sizes="(max-width: 768px) 100vw, 1280px"
          />
          {/* Capa oscura */}
          <div className="absolute inset-0 bg-black/60 z-10"></div>

          <motion.div
            className="relative z-20 w-full max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            <motion.h1
              variants={itemVariants}
              className="font-satoshi text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-tight leading-tight mb-4"
            >
              JUGÁ. COMPETÍ. DISFRUTÁ.
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="font-medium sm:text-lg md:text-xl text-white max-w-2xl mx-auto"
            >
              Encontrá tu cancha, reservá tu próximo partido.
            </motion.p>
          </motion.div>
        </div>

        {/* --- Contenedor de la Barra de Búsqueda con clases responsivas --- */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="relative w-[90%] max-w-4xl mx-auto -mt-20 z-30 sm:absolute sm:-mt-0 sm:-bottom-10 sm:left-1/2 sm:-translate-x-1/2"
        >
          <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100">
            <SearchBar variant="hero" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
