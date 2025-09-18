"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Shield, DollarSign } from "lucide-react";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import { toast } from "react-hot-toast";
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

// --- TIPOS (Alineados con los datos reales) ---
// Usamos tipos más completos para tener acceso a toda la info necesaria.
type Club = {
  id: string;
  name: string;
  address: string;
};

type Court = {
  id: string;
  name: string;
  pricePerHour: number;
  depositAmount: number;
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  court: Court;
  time: string;
  date: Date;
}

// Inicializamos Mercado Pago con tu Public Key de PRUEBA.
// Es importante que esta sea la 'Public Key', no el 'Access Token'.
initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, { locale: 'es-AR' });

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  club,
  court,
  time,
  date,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  /**
   * Esta función ahora llama a nuestro backend para crear una preferencia de pago.
   */
  const handleCreatePreference = async () => {
    setIsProcessing(true);
    toast.loading("Generando link de pago...");

    try {
      const response = await fetch('/api/bookings/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complexId: club.id,
          courtId: court.id,
          date: date.toISOString(),
          time: time,
          price: court.pricePerHour,
          depositAmount: court.depositAmount,
        }),
      });
      
      toast.dismiss();
      if (!response.ok) {
        throw new Error("No se pudo generar el link de pago.");
      }

      const { preferenceId } = await response.json();
      setPreferenceId(preferenceId); // Guardamos el ID para renderizar el checkout

    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Error desconocido.");
      console.error("Error creating preference:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reseteamos el estado del modal cuando se cierra para que esté listo la próxima vez
  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setPreferenceId(null);
    }, 300); // Pequeño delay para que la animación de salida termine
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 m-4"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            {/* Vista 1: Confirmación de datos */}
            {!preferenceId && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Confirmá tu Reserva
                </h2>

                <div className="space-y-4 text-left border-t border-b py-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-brand-orange" />
                    <p><span className="font-semibold">{club.name}</span> - {court.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-orange" />
                    <p>{date.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand-orange" />
                    <p>{time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-brand-orange" />
                    <p>Total a pagar: <span className="font-bold">{court.pricePerHour.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</span></p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-center text-paragraph mb-4">
                    Para confirmar tu turno, es necesario abonar una seña.
                  </p>
                  <ButtonPrimary onClick={handleCreatePreference} className="w-full" disabled={isProcessing}>
                    {isProcessing ? "Procesando..." : `Ir a pagar seña de ${court.depositAmount.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}`}
                  </ButtonPrimary>
                </div>
              </div>
            )}
            
            {/* Vista 2: Checkout de Mercado Pago */}
            {preferenceId && (
                 <div className="text-center">
                     <h2 className="text-2xl font-bold text-foreground mb-4">Completá el pago</h2>
                     <p className="text-paragraph mb-6">Serás redirigido al finalizar la compra.</p>
                    <Wallet initialization={{ preferenceId: preferenceId }} />
                </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};