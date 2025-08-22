"use client";
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ButtonPrimary, ButtonGhost } from '@/shared/components/ui/Buttons'; // Asegúrate que la ruta sea correcta

const images = [
  { src: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=870&auto=format&fit=crop", alt: "Fútbol" },
  { src: "/bg3.webp", alt: "Pádel" },
  { src: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=870&auto=format&fit=crop", alt: "Básquet" }
];

export const BannerCTA = () => {
  // Número de WhatsApp en formato internacional sin el '+'
  const whatsappNumber = "5493491699012";
  const whatsappMessage = "Hola! Quisiera saber más sobre CheCancha para mi complejo deportivo.";

  return (
    <motion.section 
      className="bg-brand-olive text-white"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.8 } }
      }}
    >
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Columna de Texto */}
          <div className="text-center lg:text-left">
            <h2 className="font-lora text-4xl md:text-5xl font-semibold leading-tight mb-6">
              Elegí CheCancha y llevá tu negocio al siguiente nivel
            </h2>
            <p className="text-lg text-brand-beige mb-10 max-w-lg mx-auto lg:mx-0">
              Te damos las mejores herramientas para aumentar tus ventas, optimizar tu tiempo y fidelizar a tus clientes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <ButtonPrimary href="/inscriptions">
                Solicitar una Demo
              </ButtonPrimary>
              {/* Botón actualizado con el enlace a WhatsApp */}
              <ButtonGhost 
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                className="text-white hover:bg-white/10"
                target="_blank"
                rel="noopener noreferrer"
              >
                ¿Tenés dudas? Escribinos
              </ButtonGhost>
            </div>
          </div>

          {/* Columna de Imágenes */}
          <motion.div 
            className="hidden lg:grid grid-cols-3 gap-4"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {images.map((image, index) => (
              <div 
                key={index}
                className={`aspect-[3/4] relative rounded-xl overflow-hidden ${index === 1 ? 'mt-8' : ''}`}
              >
                <Image 
                  src={image.src} 
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0vw, 15vw"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
