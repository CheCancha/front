"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  Shield,
  DollarSign,
  User,
  Phone,
} from "lucide-react";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import { toast } from "react-hot-toast";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useSession } from "next-auth/react";
import { Spinner } from "@/shared/components/ui/Spinner";
import { Button } from "@/shared/components/ui/button";
// --- IMPORTE AGREGADO ---
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/shared/components/ui/alert-dialog";


// --- TIPOS ---
type Club = {
  id: string;
  name: string;
  cancellationPolicyHours: number;
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

// --- Funciones Helper ---
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateEndTime = (
  startTime: string,
  durationMinutes: number
): string => {
  if (!startTime || !durationMinutes) return "";
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
  if (!court || !court.priceRules || court.priceRules.length === 0) {
    return { price: 0, depositAmount: 0 };
  }
  const [hours] = time.split(":").map(Number);
  const rule = court.priceRules.find(
    (r) => hours >= r.startTime && hours < r.endTime
  );
  return rule || court.priceRules[0] || { price: 0, depositAmount: 0 };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);

// --- Componente Principal del Modal ---
export default function BookingModal({
  isOpen,
  onClose,
  club,
  court,
  time,
  date,
}: BookingModalProps) {
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [preferenceData, setPreferenceData] = useState<{
    id: string;
    publicKey: string;
  } | null>(null);
  
  // --- ESTADOS AGREGADOS PARA EL DIÁLOGO DE CONFLICTO ---
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");

  // --- ESTADOS PARA CUPONES ---
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    newTotalPrice: number;
  } | null>(null);

  useEffect(() => {
    if (preferenceData?.publicKey) {
      initMercadoPago(preferenceData.publicKey, { locale: "es-AR" });
    }
  }, [preferenceData]);

  const priceRule = useMemo(() => getPriceForTime(court, time), [court, time]);
  const originalTotalPrice = priceRule.price;
  const originalDepositAmount = priceRule.depositAmount;
  const totalPrice = appliedCoupon
    ? appliedCoupon.newTotalPrice
    : originalTotalPrice;
  const depositAmount = originalDepositAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Ingresá un código.");
      return;
    }
    setIsVerifyingCoupon(true);
    setCouponError(null);
    try {
      const response = await fetch(`/api/complex/${club.id}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponCode.toUpperCase(),
          originalPrice: originalTotalPrice,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El código del cupón no es válido o no se encontró.");
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "El cupón no es válido.");
      }

      setAppliedCoupon(data);
      setShowCouponInput(false);
      toast.success("¡Cupón aplicado con éxito!");
    } catch (error) {
      setCouponError(
        error instanceof Error ? error.message : "Error al validar el cupón."
      );
      setAppliedCoupon(null);
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  const handleCreatePreference = async () => {
    const phoneRegex = /^[0-9]{8,}$/;
    if (status === "unauthenticated") {
      if (!guestName.trim()) {
        toast.error("Por favor, completá tu nombre y apellido.");
        return;
      }
      if (!guestPhone.trim() || !phoneRegex.test(guestPhone)) {
        toast.error("Por favor, ingresá un número de teléfono válido.");
        return;
      }
    }
    
    if (depositAmount <= 0) {
      toast.error("No se puede generar un link de pago para una seña de $0.");
      return;
    }

    setIsProcessing(true);
    toast.loading("Generando link de pago...");

    try {
      const formattedDate = formatDateForAPI(date);

      const response = await fetch("/api/bookings/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complexId: club.id,
          courtId: court.id,
          date: formattedDate,
          time: time,
          price: totalPrice,
          depositAmount: depositAmount,
          guestName: guestName,
          guestPhone: guestPhone,
        }),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "No se pudo generar el link de pago." }));

        // --- MANEJO DEL CONFLICTO 409 CON DIÁLOGO ---
        if (response.status === 409) {
          setConflictMessage(errorData.error || "Este horario ya no está disponible.");
          setShowConflictAlert(true);
        } else {
          throw new Error(errorData.error);
        }
        return;
      }
      
      const responseData = await response.json();
      setPreferenceData({
        id: responseData.preferenceId,
        publicKey: responseData.publicKey,
      });

    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Error desconocido.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setPreferenceData(null);
      setGuestName("");
      setGuestPhone("");
      setShowCouponInput(false);
      setCouponCode("");
      setCouponError(null);
      setAppliedCoupon(null);
    }, 300);
  };

  // --- MANEJADOR PARA CERRAR EL DIÁLOGO DE ALERTA ---
  const handleAlertClose = () => {
    setShowConflictAlert(false);
    handleClose(); 
    window.location.reload(); // Recarga para ver disponibilidad actualizada
  }

  return (
    <>
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

              {!preferenceData ? (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                    Confirmá tu Reserva
                  </h2>

                  {status === "unauthenticated" && (
                    <div className="mb-4 space-y-3">
                      <div>
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
                      <div>
                        <label
                          htmlFor="guestPhone"
                          className="block text-sm font-semibold text-gray-700 mb-1"
                        >
                          <Phone className="inline-block w-4 h-4 mr-1" /> Teléfono
                          (WhatsApp)
                        </label>
                        <input
                          type="tel"
                          id="guestPhone"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          placeholder="3491123456"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Lo usaremos para contactarte por tu reserva si es
                          necesario.
                        </p>
                      </div>
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
                          )}{" "}
                          hs
                        </span>{" "}
                        <span className="text-gray-500 text-sm ml-2">
                          ({court?.slotDurationMinutes || 60} min)
                        </span>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-brand-orange mt-1" />
                      <div>
                        {appliedCoupon ? (
                          <>
                            <p className="text-gray-500 line-through">
                              {formatCurrency(originalTotalPrice)}
                            </p>
                            <p className="text-green-600 font-semibold">
                              Descuento: -
                              {formatCurrency(appliedCoupon.discountAmount)}
                            </p>
                            <p>
                              Nuevo Total:{" "}
                              <span className="font-bold">
                                {formatCurrency(totalPrice)}
                              </span>
                            </p>
                          </>
                        ) : (
                          <p>
                            Total a pagar:{" "}
                            <span className="font-bold">
                              {formatCurrency(totalPrice)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* --- SECCIÓN DE CUPÓN --- */}
                  <div className="py-4 text-sm">
                    {appliedCoupon ? (
                      <div className="flex justify-between items-center text-green-700">
                        <span>
                          Cupón <strong>{appliedCoupon.code}</strong> aplicado.
                        </span>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-xs font-semibold underline hover:text-red-600"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : !showCouponInput ? (
                      <button
                        onClick={() => setShowCouponInput(true)}
                        className="text-brand-orange font-semibold hover:underline"
                      >
                        ¿Tenés un cupón de descuento?
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value);
                              if (couponError) setCouponError(null);
                            }}
                            placeholder="Ingresá tu código"
                            className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                          />
                          <Button
                            onClick={handleApplyCoupon}
                            disabled={isVerifyingCoupon}
                            className="whitespace-nowrap"
                          >
                            {isVerifyingCoupon ? <Spinner /> : "Aplicar"}
                          </Button>
                          {couponError && (
                            <p className="text-red-500 text-xs">{couponError}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setShowCouponInput(false);
                              setCouponError(null);
                              setCouponCode("");
                            }}
                            className="text-sm p-2 text-black hover:bg-red-100 rounded-md"
                          >
                            <X />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-center text-gray-500">
                    ⚠️{" "}
                    {club.cancellationPolicyHours > 0 ? (
                      <>
                        Podrás cancelar sin costo hasta{" "}
                        <strong>{club.cancellationPolicyHours} horas</strong>{" "}
                        antes del turno.
                      </>
                    ) : (
                      <strong>
                        Una vez confirmada, esta reserva no permite reembolso.
                      </strong>
                    )}
                  </p>

                  <div className="mt-4">
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
                        : `Ir a pagar seña de ${formatCurrency(depositAmount)}`}
                    </ButtonPrimary>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Completá el pago
                  </h2>
                  <p className="text-paragraph mb-6">
                    Serás redirigido al finalizar la compra.
                  </p>
                  <Wallet initialization={{ preferenceId: preferenceData.id }} />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DIÁLOGO DE ALERTA PARA EL CONFLICTO --- */}
      <AlertDialog open={showConflictAlert} onOpenChange={setShowConflictAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Turno no disponible!</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictMessage} Alguien más reservó este horario mientras confirmabas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAlertClose}>Ver otros horarios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}