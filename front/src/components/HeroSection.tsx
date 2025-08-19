// components/HeroSection.tsx
import type { FC } from 'react';
import Image from 'next/image';
import { MapPinIcon, CalendarDaysIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

const HeroSection: FC = () => {
  return (
    // El contenedor principal ya es relativo, lo que es perfecto para el <Image> con `fill`.
    <div className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center text-white">
      
      {/* 1. Contenedor para la Imagen de Fondo */}
      <div className="relative top-0 left-0 w-6xl h-full rounded-xl overflow-hidden">
        <Image
          src="/bg3.jpg" // Asegúrate de que esta imagen esté en tu carpeta /public
          alt="Jugadores de fútbol en acción"
          fill 
          className="object-cover" 
          priority // Opcional: Carga esta imagen de forma prioritaria ya que es "Above the Fold"
        />
        {/* Overlay oscuro para mejorar la legibilidad del texto */}
        <div className="absolute top-0 left-0 w-full h-full bg-brand-dark bg-opacity-60"></div>
      </div>

      {/* 2. Contenido del Hero (sin cambios) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center px-4">
        <h1 className="font-lora text-5xl md:text-7xl font-medium leading-tight mb-4">
          Encontrá tu cancha, reservá tu partido.
        </h1>
        <p className="font-satoshi text-lg md:text-xl text-brand-beige max-w-2xl mx-auto mb-10">
          La forma más fácil de buscar, comparar y reservar canchas de tu deporte favorito en tu ciudad.
        </p>

        {/* 3. Barra de Búsqueda Compleja (sin cambios) */}
        <div className="bg-white rounded-lg p-4 max-w-4xl mx-auto">
          <form className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 items-center">
            
            {/* Input: Ciudad */}
            <div className="relative w-full">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por ciudad" 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md font-satoshi text-brand-dark focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
            
            {/* Input: Deporte (Select) */}
            <div className="relative w-full">
               {/* Aquí usaríamos una librería como Headless UI para un select custom, pero un select normal funciona para empezar */}
              <select 
                className="w-full px-4 py-3 border border-gray-200 rounded-md font-satoshi text-brand-dark focus:ring-2 focus:ring-brand-green appearance-none outline-none"
                defaultValue="" 
              >
                <option value="" disabled>
                  Elige un deporte
                </option>
                <option value="futbol">Fútbol</option>
                <option value="padel">Pádel</option>
                <option value="tenis">Tenis</option>
                <option value="basquet">Básquet</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Input: Día */}
            <div className="relative w-full">
              <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="date" 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md font-satoshi text-brand-dark focus:ring-2 focus:ring-brand-green outline-none"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Input: Hora */}
            <div className="relative w-full">
              <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="time" 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md font-satoshi text-brand-dark focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>

            {/* Botón de Búsqueda (CTA) */}
            <button 
              type="submit" 
              className="w-full lg:col-span-1 bg-brand-orange hover:bg-opacity-90 text-white font-satoshi font-bold py-3 px-6 rounded-md flex items-center justify-center transition-colors duration-300"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Buscar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
