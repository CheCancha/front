"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export const CTASection = () => {
  return (
    <motion.section
      className="relative py-20 bg-foreground text-white"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
    >
      {/* Imagen de fondo con overlay */}
      <Image
        src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070&auto=format&fit=crop"
        alt="Jugadores celebrando en una cancha"
        fill
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Contenido */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <h2 className="font-lora text-3xl md:text-5xl font-bold mb-4">
          ¿Listo para tu próximo partido?
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Unite a la comunidad CheCancha y llevá tu juego a otro nivel. La
          cancha te espera.
        </p>
        <Link
          href="#inicio"
          className="inline-flex items-center justify-center rounded-full font-medium py-4 px-8 text-white bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-300 hover:brightness-110 cursor-pointer"
        >
          Ir a Reservar
        </Link>
      </div>
    </motion.section>
  );
};
