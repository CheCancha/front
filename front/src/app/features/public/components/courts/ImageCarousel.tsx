"use client";

import { useState } from "react";
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

  const hasMultipleImages = images.length > 1;

  const prevSlide = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextSlide = () =>
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden group">
      {/* Contenedor de imágenes para la transición */}
      <div className="w-full h-full relative">
        <AnimatePresence initial={false}>
            <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
            >
                <Image
                    src={images[currentIndex].url}
                    alt={`Imagen del complejo ${currentIndex + 1}`}
                    fill
                    className="object-cover"
                    priority={currentIndex === 0}
                    sizes="(max-width: 768px) 100vw, 1280px"
                />
            </motion.div>
        </AnimatePresence>
      </div>

      {hasMultipleImages && (
        <>
          <button
            onClick={prevSlide}
            className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 focus:outline-none"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 focus:outline-none"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Indicadores de Puntos */}
      {hasMultipleImages && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                  <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          currentIndex === index ? "bg-white" : "bg-white/50"
                      )}
                  />
              ))}
          </div>
      )}
    </div>
  );
};