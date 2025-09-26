"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Shield, DollarSign, User } from "lucide-react";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import { toast } from "react-hot-toast";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useSession } from "next-auth/react";

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
    depositAmount: number;
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

// --- FUNCIÓN CORREGIDA Y MÁS ROBUSTA ---
const getPriceForTime = (court: Court, time: string) => {
  // Verificación de seguridad: si 'court' o 'court.priceRules' no existen o están vacíos,
  // devolvemos un objeto default para evitar el crash.
  if (!court || !court.priceRules || court.priceRules.length === 0) {
    console.error(
      "BookingModal Error: Se recibieron datos de la cancha incompletos o sin reglas de precio.",
      { court, time }
    );
    // Devolvemos un objeto con la estructura esperada para que el resto del componente no falle
    return { price: 0, depositAmount: 0, startTime: 0, endTime: 0, id: "" };
  }

  const [hours] = time.split(":").map(Number);
  const rule = court.priceRules.find(
    (r) => hours >= r.startTime && hours < r.endTime
  );

  // Si no se encuentra una regla específica, usamos la primera como fallback.
  return rule || court.priceRules[0];
};

if (process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, {
    locale: "es-AR",
  });
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  club,
  court,
  time,
  date,
}) => {
  const { status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");

  // Ahora esta llamada es segura y no causará un crash
  const priceRule = getPriceForTime(court, time);
  const totalPrice = priceRule.price;
  const depositAmount = priceRule.depositAmount;

  // El resto del componente permanece igual...
  const handleCreatePreference = async () => {
    if (status === "unauthenticated" && !guestName.trim()) {
      toast.error("Por favor, ingresá tu nombre y apellido.");
      return;
    }
    if (depositAmount <= 0) {
      toast.error("No se puede generar un link de pago para una seña de $0.");
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
          depositAmount: depositAmount,
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
                      <span className="font-semibold">{club?.name}</span> -{" "}
                      {court?.name}
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
                        {calculateEndTime(
                          time,
                          court?.slotDurationMinutes || 60
                        )}
                        hs
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        ({court?.slotDurationMinutes || 60} min)
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
                    disabled={isProcessing || depositAmount <= 0}
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

export default BookingModal;
