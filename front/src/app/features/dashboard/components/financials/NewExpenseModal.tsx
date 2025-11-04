import { AlertDialogHeader } from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { PaymentMethod, TransactionSource } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    amount: number;
    description: string;
    source: TransactionSource;
    paymentMethod: PaymentMethod;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  // Estado local del formulario del modal
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<TransactionSource>(
    TransactionSource.GASTO
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.EFECTIVO
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Por favor, ingrese un monto válido.");
      return;
    }
    if (description.trim() === "") {
      toast.error("La descripción es obligatoria.");
      return;
    }

    onSubmit({
      amount: numericAmount,
      description,
      source,
      paymentMethod,
    });
  };

  return (
    <DialogContent
      className="sm:max-w-[425px]"
      onCloseAutoFocus={(e) => e.preventDefault()}
    >
      <AlertDialogHeader>
        <DialogTitle>Registrar Egreso</DialogTitle>
        <DialogDescription>
          Registre un pago a proveedores, devolución de seña, o cualquier salida
          de dinero.
        </DialogDescription>
      </AlertDialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Pago a proveedor de limpieza"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="source">Fuente</Label>
            <Select
              value={source}
              onValueChange={(v) => setSource(v as TransactionSource)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransactionSource.GASTO}>Gasto</SelectItem>
                <SelectItem value={TransactionSource.OTRO}>Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentMethod.EFECTIVO}>Efectivo</SelectItem>
                <SelectItem value={PaymentMethod.TRANSFERENCIA}>
                  Transferencia
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Registrar Egreso"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};
