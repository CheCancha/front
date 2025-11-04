import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/inputshadcn";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { BookingPlayer, PaymentMethod } from "@prisma/client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

type UserSnippet = {
  id: string;
  name: string;
  email: string | null;
};
type BookingPlayerWithUser = BookingPlayer & { user: UserSnippet | null };

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: BookingPlayerWithUser;
  onSubmit: (payload: {
    amount: number;
    paymentMethod: PaymentMethod;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({
  isOpen,
  onClose,
  player,
  onSubmit,
  isSubmitting,
}) => {
  const [amountInput, setAmountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.EFECTIVO
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor, ingrese un monto válido.");
      return;
    }

    onSubmit({ amount, paymentMethod });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registra el pago para **
            {player.user?.name || player.guestName || "Invitado"}.**
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto Pagado</Label>
            <Input
              id="amount"
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="1000"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
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
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Confirmar Pago"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
