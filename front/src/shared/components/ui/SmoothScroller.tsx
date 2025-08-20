"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

export const SmoothScroller = () => {
  useEffect(() => {
    // 1. Inicializamos Lenis
    const lenis = new Lenis({
      duration: 1.4, // Velocidad de la animación (más alto = más lento)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // 2. Creamos una función para el bucle de animación
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    // 3. Iniciamos el bucle
    requestAnimationFrame(raf);

    // 4. Limpiamos la instancia al desmontar el componente
    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
};
