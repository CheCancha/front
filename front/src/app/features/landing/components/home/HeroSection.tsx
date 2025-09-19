"use client";

import type { FC } from "react";
import Image from "next/image";
import { SearchBar } from "@/shared/components/ui/Searchbar";

const HeroSection: FC = () => {
  return (
    <div className="w-full h-[80vh] min-h-[600px] my-16 flex items-center justify-center text-background bg-background">
      {/* Contenedor para la Imagen de Fondo */}
      <div className="relative top-0 left-0 w-full h-full rounded-xl overflow-hidden max-w-7xl">
        <Image
          src="/paddle.webp"
          alt="Jugadores de pádel en acción"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL="/paddle.webp"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-foreground/70 "></div>
      </div>

      {/* Contenido del Hero */}
      <div className="absolute z-10 w-full max-w-5xl mx-auto text-center px-4 ">
        <h1 className="font-lora text-5xl md:text-7xl font-medium leading-tight mb-4">
          Encontrá tu cancha, reservá tu partido.
        </h1>
        <p className="font-satoshi text-lg md:text-xl text-brand-beige max-w-2xl mx-auto mb-10">
          La forma más fácil de buscar, comparar y reservar canchas de tu
          deporte favorito en tu ciudad.
        </p>

        <SearchBar />
      </div>
    </div>
  );
};

export default HeroSection;
