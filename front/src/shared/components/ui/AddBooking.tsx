"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Shield, DollarSign, User } from "lucide-react";
import { toast } from "react-hot-toast";

// --- COMPONENTES Y HOOKS DE MARCADOR DE POSICIÓN PARA RESOLVER ERRORES ---

// Reemplazo para "@/shared/components/ui/Buttons"
const ButtonPrimary = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
  <button
    {...props}
    className={`bg-black text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

// Reemplazo para "@mercadopago/sdk-react"
const initMercadoPago = (publicKey: string, options?: { locale: string }) => {
  console.log("Mercado Pago SDK inicializado.");
};
const Wallet = ({ initialization }: { initialization: { preferenceId: string } }) => (
  <div className="p-4 border rounded-lg bg-gray-50">
    <p className="text-sm font-semibold">Componente de Pago de Mercado Pago</p>
    <p className="text-xs text-gray-600">ID de Preferencia: {initialization.preferenceId}</p>
    <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg">Pagar Ahora (Simulado)</button>
  </div>
);


// Reemplazo para "next-auth/react"
const useSession = () => {
    // Simulamos un usuario no autenticado, que es el caso más común para este modal.
    return { data: null, status: "unauthenticated" };
}


// --- TIPOS ---
type Club = {
  id: string;
  name: string;
};

type Court = {
  id: string;
  name: string;
  slotDurationMinutes: number;
  priceRules: {
    id: string;
    startTime: number;
    endTime: number;
    price: number;
    depositPercentage: number;
  }[];
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  court: Court;
  time: string;
  date: Date;
}

const calculateEndTime = (
  startTime: string,
  durationMinutes: number
): string => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalStartMinutes = hours * 60 + minutes;
  const totalEndMinutes = totalStartMinutes + durationMinutes;
  const endHours = Math.floor(totalEndMinutes / 60);
  const endMinutes = totalEndMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
    2,
    "0"
  )}`;
};

const getPriceForTime = (court: Court, time: string) => {
  const [hours] = time.split(":").map(Number);
  const rule = court.priceRules.find(
    (r) => hours >= r.startTime && hours < r.endTime
  );
  // Devuelve la regla encontrada o la primera como fallback seguro
  return rule || court.priceRules[0];
};

if (process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY) {
    initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
      locale: "es-AR",
    });
}


export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  club,
  court,
  time,
  date,
}) => {
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");

  const priceRule = getPriceForTime(court, time);
  const totalPrice = priceRule.price;

  // El campo 'depositPercentage' en realidad contiene el MONTO FIJO de la seña.
  const depositAmount = priceRule.depositPercentage;

  const handleCreatePreference = async () => {
    if (status === "unauthenticated" && !guestName.trim()) {
      toast.error("Por favor, ingresá tu nombre y apellido.");
      return;
    }
    setIsProcessing(true);
    toast.loading("Generando link de pago...");
    try {
      const response = await fetch("/api/bookings/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complexId: club.id,
          courtId: court.id,
          date: date.toISOString(),
          time: time,
          price: totalPrice,
          depositAmount: depositAmount, // Se envía el monto correcto
          guestName: guestName,
        }),
      });
      toast.dismiss();
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(responseText || "No se pudo generar el link de pago.");
      }
      const { preferenceId } = JSON.parse(responseText);
      setPreferenceId(preferenceId);
    } catch (error) {
      toast.dismiss();
      toast.error(
        error instanceof Error ? error.message : "Error desconocido."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setPreferenceId(null);
      setGuestName("");
    }, 300);
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
            {!preferenceId && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Confirmá tu Reserva
                </h2>
                {status === "unauthenticated" && (
                  <div className="mb-4">
                    <label
                      htmlFor="guestName"
                      className="block text-sm font-semibold text-gray-700 mb-1"
                    >
                      <User className="inline-block w-4 h-4 mr-1" /> Nombre y
                      Apellido
                    </label>
                    <input
                      type="text"
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      placeholder="Juan Pérez"
                    />
                  </div>
                )}
                <div className="space-y-4 text-left border-t border-b py-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-brand-orange" />
                    <p>
                      <span className="font-semibold">{club.name}</span> -{" "}
                      {court.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-orange" />
                    <p>
                      {date.toLocaleDateString("es-AR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand-orange" />
                    <p>
                      <span className="font-semibold">
                        {time} a{" "}
                        {calculateEndTime(time, court.slotDurationMinutes)}hs
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        ({court.slotDurationMinutes} min)
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-brand-orange" />
                    <p>
                      Total a pagar:{" "}
                      <span className="font-bold">
                        {totalPrice.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        })}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-center text-paragraph mb-4">
                    Para confirmar tu turno, es necesario abonar una seña.
                  </p>
                  <ButtonPrimary
                    onClick={handleCreatePreference}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? "Procesando..."
                      : `Ir a pagar seña de ${depositAmount.toLocaleString(
                          "es-AR",
                          { style: "currency", currency: "ARS" }
                        )}`}
                  </ButtonPrimary>
                </div>
              </div>
            )}
            {preferenceId && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Completá el pago
                </h2>
                <p className="text-paragraph mb-6">
                  Serás redirigido al finalizar la compra.
                </p>
                <Wallet initialization={{ preferenceId: preferenceId }} />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

