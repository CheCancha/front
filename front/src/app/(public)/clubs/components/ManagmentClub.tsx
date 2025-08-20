import Image from "next/image";
import React from "react";

export const ManagmentClub = () => {
  return (
    <div>
      <div className="my-16 text-center">
        <span>Probalo GRATIS</span>
        <h2 className="font-lora text-3xl md:text-5xl font-semibold">
          Gestiona tu complejo de forma{" "}
          <span className='text-brand-orange'>100% online.</span>
        </h2>
        <div className="flex gap-2 mx-auto justify-center mt-4">
          <button className="bg-brand-olive py-2 px-4 rounded-xl text-white font-medium hover:bg-foreground transition duration-200 cursor-pointer">
            Ver planes y precios
          </button>
          <button className="bg-brand-olive py-2 px-4 rounded-xl text-white font-medium hover:bg-foreground transition duration-200 cursor-pointer">
            Contactarme
          </button>
        </div>
      </div>
      <div className="relative top-0 left-0 w-7xl h-full rounded-xl overflow-hidden">
        <Image
          src="/bg2.jpg"
          alt="Jugadores de fútbol en acción"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
};
