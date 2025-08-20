import Image from "next/image";
import Link from "next/link";
import React from "react";

export const HeroClub = () => {
  return (
    <section className="relative min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative top-0 left-0 w-7xl h-full rounded-xl overflow-hidden g:hidden">
        <Image
          src="/bgmanagment.jpg"
          alt="Jugadores de fútbol en acción"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Columna 1: Contenido de Texto */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center lg:text-left lg:items-start min-h-screen bg-background p-8 lg:p-16">
        <div className="max-w-xl">
          <h1 className="font-lora text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-6 text-foreground">
            Automatiza tus reservas. Maximiza tus ingresos con gestión
            inteligente.
          </h1>
          <p className="font-satoshi text-lg md:text-xl text-paragraph mb-10">
            CheCancha es la plataforma todo-en-uno que simplifica la gestión de
            tu complejo deportivo y te ayuda a aumentar tus ingresos. Menos
            administración, más crecimiento.
          </p>
          <Link
            href="/demo"
            className="inline-block bg-brand-green text-white font-semibold py-3 px-6 rounded-full text-lg hover:bg-foreground transition duration-300"
          >
            Ver una Demo
          </Link>
        </div>
      </div>

      {/* Columna 2: Imagen (visible solo en pantallas grandes) */}
      <div className="hidden lg:block relative h-full ">
        <Image
          src="/bg.jpg"
          alt="Jugadores de fútbol en acción"
          fill
          className="object-cover rounded-2xl"
          priority
          sizes="50vw"
        />
      </div>
    </section>
  );
};
