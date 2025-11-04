import React, { memo } from "react";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";

// Importa los tipos y helpers que necesitas
import { BookingPlayerWithUser } from "@/shared/entities/booking/bookingTypes";
import { formatCurrency } from "@/shared/helper/formatCurrency";
import { cn } from "@/shared/lib/utils";

interface PlayerCardProps {
  player: BookingPlayerWithUser;
  onPaymentStart: (player: BookingPlayerWithUser) => void;
  onDelete: (playerId: string) => void;
}

export const PlayerCard = memo(
  ({ player, onPaymentStart, onDelete }: PlayerCardProps) => {
    const displayName = player.user?.name || player.guestName || "Jugador";

    const handleRegisterPayment = () => {
      onPaymentStart(player);
    };

    return (
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{displayName}</p>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium",
              player.paymentStatus === "PAGADO"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-yellow-50 text-yellow-800 border border-yellow-200"
            )}
          >
            {player.paymentStatus === "PAGADO" ? (
              <>
                {formatCurrency(player.amountPaid)}
                <span className="text-gray-400">•</span>
                <span className="capitalize">
                  {player.paymentMethod?.toLowerCase()}
                </span>
              </>
            ) : (
              <>
                Pendiente
                {player.amountPaid > 0 && (
                  <span className="text-gray-500">
                    ({formatCurrency(player.amountPaid)} parcial)
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {player.paymentStatus !== "PAGADO" && (
            <Button size="sm" onClick={handleRegisterPayment}>
              Registrar Pago
            </Button>
          )}
          {player.amountPaid === 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:bg-red-500/10"
              onClick={() => onDelete(player.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);
PlayerCard.displayName = "PlayerCard";
