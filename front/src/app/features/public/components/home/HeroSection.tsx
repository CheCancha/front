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
    <section
      className="relative w-full min-h-[85vh] flex items-center justify-center text-white py-20 px-4 lg:h-[80vh] lg:min-h-[600px] lg:my-16 lg:py-0 lg:px-8 lg:bg-background"
      id="inicio"
    >
      <div className="absolute inset-0 lg:relative lg:w-full lg:h-full lg:max-w-7xl lg:rounded-xl lg:overflow-hidden">
        <Image
          src="/paddle.webp"
          alt="Jugadores de pádel en acción"
          fill
          className="object-cover"
          priority
          sizes="(min-width: 1024px) 1280px, 100vw"
        />
        <div className="absolute inset-0 bg-black/60 lg:bg-foreground/70"></div>
      </div>

      <motion.div
        className="relative z-10 w-full max-w-4xl mx-auto text-center lg:absolute"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        <motion.h1
          variants={itemVariants}
          className="font-lora text-4xl sm:text-5xl md:text-6xl font-medium leading-tight mb-4"
        >
          Encontrá tu cancha, reservá tu partido.
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="font-satoshi text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10"
        >
          La forma más fácil de buscar, comparar y reservar canchas de tu
          deporte favorito en tu ciudad.
        </motion.p>

        <motion.div variants={itemVariants}>
          {/* --- AJUSTE CLAVE: Se aplica un fondo semi-transparente con efecto de desenfoque --- */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <SearchBar variant="hero" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
