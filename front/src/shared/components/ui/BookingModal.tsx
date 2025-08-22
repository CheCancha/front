"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Shield, DollarSign, Check } from 'lucide-react';
import { ButtonPrimary } from '@/shared/components/ui/Buttons';

// --- TIPOS ---
type Club = {
  id: number;
  name: string;
  address: string;
};

type Court = {
    id: number;
    name: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  court: Court;
  time: string;
  date: Date;
  price: number;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  club,
  court,
  time,
  date,
  price,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handlePayDeposit = () => {
    console.log("Redirigiendo a Mercado Pago para pagar la seña...");
    setIsConfirmed(true);
    setTimeout(() => {
        onClose();
        setIsConfirmed(false);
    }, 3000);
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
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>

            {isConfirmed ? (
              <div className="text-center">
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="mx-auto text-green-500 w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mb-4">
                  <Check size={40} />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground">¡Reserva Confirmada!</h2>
                <p className="text-paragraph mt-2">Recibirás un correo con todos los detalles. ¡A jugar!</p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Confirmá tu Reserva</h2>
                
                <div className="space-y-4 text-left border-t border-b py-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-brand-orange" />
                    <p><span className="font-semibold">{club.name}</span> - {court.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-orange" />
                    <p>{date.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand-orange" />
                    <p>{time}</p>
                  </div>
                   <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-brand-orange" />
                    <p>Total a pagar: <span className="font-bold">{price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span></p>
                  </div>
                </div>

                <div className="mt-6">
                    <p className="text-sm text-center text-paragraph mb-4">Para confirmar tu turno, es necesario abonar una seña.</p>
                    <ButtonPrimary onClick={handlePayDeposit} className="w-full">
                        Ir a pagar seña de $5.000
                    </ButtonPrimary>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
