import React, { memo, useMemo } from "react";
import {
  User,
  Phone,
  DollarSign,
  BarChart,
  Clock,
  List,
  AlertTriangle,
} from "lucide-react";
import { InfoRow } from "./InfoRow";
import { BookingStatus, PaymentMethod } from "@prisma/client";
import { SubmitPayload } from "./BookingSheet";
import { CourtWithSport } from "@/shared/entities/complex/types";
import { Input } from "@/shared/components/ui/inputshadcn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/ui/Spinner";

interface FormViewProps {
  handleSubmit: (e: React.FormEvent) => void;
  formData: Omit<SubmitPayload, "depositPaid">;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (
    name: keyof Omit<SubmitPayload, "depositPaid" | "guestPhone">,
    value: string
  ) => void;
  depositPaidInput: string;
  setDepositPaidInput: (value: string) => void;
  courts: CourtWithSport[];
  timeSlots: string[];
  warning: string | null;
  onClose: () => void;
  isSubmitting?: boolean;
  initialSlot: { courtId: string; time: string } | null;
}

export const BookingFormView = memo(
  ({
    handleSubmit,
    formData,
    handleChange,
    handleSelectChange,
    depositPaidInput,
    setDepositPaidInput,
    courts,
    timeSlots,
    warning,
    onClose,
    isSubmitting,
    initialSlot,
  }: FormViewProps) => {
    const selectedCourtName = useMemo(() => {
      if (!initialSlot) return "";
      return courts.find((c) => c.id === initialSlot.courtId)?.name || "";
    }, [initialSlot, courts]);

    const isCreatingFromSlot = initialSlot;

    return (
      <>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {/* --- 1. DATOS DEL CLIENTE --- */}
          <div>
            <label
              htmlFor="guestName"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              <User className="inline-block w-4 h-4 mr-1" /> Nombre Cliente
            </label>
            <Input
              type="text"
              id="guestName"
              name="guestName"
              value={formData.guestName}
              onChange={handleChange}
              placeholder="Juan Pérez"
              required
            />
          </div>
          <div>
            <label
              htmlFor="guestPhone"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              <Phone className="inline-block w-4 h-4 mr-1" /> Teléfono
              (Opcional)
            </label>
            <Input
              type="text"
              id="guestPhone"
              name="guestPhone"
              value={formData.guestPhone || ""}
              onChange={handleChange}
              placeholder="3491123456"
            />
          </div>

          {/* --- 2. CANCHA Y HORARIO --- */}
          {isCreatingFromSlot && initialSlot ? (
            // CASO 1: Se hizo clic en la grilla (datos pre-cargados)
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={List} label="Cancha">
                {selectedCourtName}
              </InfoRow>
              <InfoRow icon={Clock} label="Horario">
                {initialSlot.time} hs
              </InfoRow>
            </div>
          ) : (
            // CASO 2: Se hizo clic en el botón '+' (datos manuales)
            <div className="grid grid-cols-2 gap-4">
              {/* Select de Cancha */}
              <div>
                <label
                  htmlFor="courtId"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  <List className="inline-block w-4 h-4 mr-1" /> Cancha
                </label>
                <Select
                  value={formData.courtId}
                  onValueChange={(value) =>
                    handleSelectChange("courtId", value)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí una cancha" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select de Hora */}
              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  <Clock className="inline-block w-4 h-4 mr-1" /> Horario
                </label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => handleSelectChange("time", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí un horario" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time} hs
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Si no hay slot inicial (caso de edición), aquí irían los SELECTS */}

          {/* --- 3. ESTADO, PAGO Y MÉTODO --- */}
          <div className="grid grid-cols-2 gap-4">
            {/* Estado */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                <BarChart className="inline-block w-4 h-4 mr-1" /> Estado
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  handleSelectChange("status", value as BookingStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="COMPLETADO">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seña Pagada */}
            <div>
              <label
                htmlFor="depositPaid"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                <DollarSign className="inline-block w-4 h-4 mr-1" /> Seña Pagada
              </label>
              <Input
                type="number"
                id="depositPaid"
                name="depositPaid"
                value={depositPaidInput}
                onChange={(e) => setDepositPaidInput(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Método de Pago (Va fuera del grid si quieres que sea full width, o dentro si quieres 3 columnas) */}
          <div>
            <label
              htmlFor="paymentMethod"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              <DollarSign className="inline-block w-4 h-4 mr-1" /> Método de
              Pago
            </label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                handleSelectChange("paymentMethod", value as PaymentMethod)
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentMethod.EFECTIVO}>Efectivo</SelectItem>
                <SelectItem value={PaymentMethod.TRANSFERENCIA}>
                  Transferencia
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* --- 4. ALERTA Y BOTONES --- */}
          {warning && (
            <div className="flex items-center gap-2 p-3 text-sm text-yellow-800 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              <span>{warning}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !!warning}>
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                "Crear Reserva"
              )}
            </Button>
          </div>
        </form>
      </>
    );
  }
);
BookingFormView.displayName = "BookingFormView";
