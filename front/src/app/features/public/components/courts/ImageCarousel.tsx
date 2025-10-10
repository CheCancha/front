"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Image as PrismaImage } from "@prisma/client";
import { cn } from "@/shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface ImageCarouselProps {
  images: PrismaImage[];
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const hasMultipleImages = images.length > 1;

  // Logs para depuración
  useEffect(() => {
    console.log(
      "[CAROUSEL] Mostrando imagen:",
      currentIndex,
      images[currentIndex]?.url
    );
  }, [currentIndex, images]);

  // --- Navegación manual ---
  const prevSlide = () => {
    if (!hasMultipleImages) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    console.log("[CAROUSEL] Click → Anterior");
  };

  const nextSlide = () => {
    if (!hasMultipleImages) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    console.log("[CAROUSEL] Click → Siguiente");
  };

  // --- Cambio automático cada 15s ---
  useEffect(() => {
    if (!hasMultipleImages) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      console.log(
        "[CAROUSEL] Cambio automático →",
        new Date().toLocaleTimeString()
      );
    }, 15000);
    return () => clearInterval(interval);
  }, [images.length, hasMultipleImages]);

  // --- Variantes para animación de slide ---
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-2xl">
      <div className="relative w-full h-full">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={`${currentIndex}-${images[currentIndex].id}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute w-full h-full"
          >
            <Image
              src={images[currentIndex].url}
              alt={`Imagen del complejo ${currentIndex + 1}`}
              fill
              className="object-cover select-none"
              priority={currentIndex === 0}
              sizes="(max-width: 768px) 100vw, 1280px"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Botones de prev y next */}
      {hasMultipleImages && (
        <>
          <button
            onClick={prevSlide}
            className="absolute z-20 top-1/2 left-4 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-100 shadow-md hover:bg-black/60 transition-all duration-300 focus:outline-none cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute z-20 top-1/2 right-4 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-100 shadow-md hover:bg-black/60 transition-all duration-300 focus:outline-none cursor-pointer"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Indicadores de puntos */}
      {hasMultipleImages && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                console.log("[CAROUSEL] Click en punto →", index);
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentIndex === index
                  ? "bg-white scale-110"
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
