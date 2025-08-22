import { routes } from "@/routes";
import { ButtonRipple } from "@/shared/components/ui/Buttons";
import Image from "next/image";
import React from "react";

export const HeroClub = () => {
  return (
    // 1. Hacemos la sección 'relative' para posicionar la curva
    <section className="min-h-[105vh] relative lg:grid lg:grid-cols-2">
      {/* Columna 1: Contenido de Texto */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center h-[90%] lg:text-left lg:items-start p-8 lg:p-16">
        <div className="max-w-xl ">
          <h1 className="font-lora text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-6 text-foreground">
            Automatiza tus reservas y maximiza tus ingresos.
          </h1>
          <p className="font-satoshi text-lg md:text-xl text-paragraph mb-10">
            CheCancha es la plataforma todo-en-uno que simplifica la gestión de
            tu complejo deportivo y te ayuda a aumentar tus ingresos. Menos
            administración, más crecimiento.
          </p>
          <ButtonRipple href={routes.inscriptions} className="z-30">
            Comienza ahora
          </ButtonRipple>
        </div>
      </div>

      {/* Columna 2: Imagen (visible solo en pantallas grandes) */}
      <div className="hidden lg:block relative h-full">
        <Image
          src="/bgmanagment.webp"
          alt="Jugadores de fútbol en acción"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
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
            className="fill-foreground
            "
          ></path>
        </svg>
      </div>
    </section>
  );
};
