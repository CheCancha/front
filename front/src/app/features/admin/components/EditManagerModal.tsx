"use client";

import React, { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { ComplexWithManager } from "@/shared/entities/complex/types";
import { updateManager } from "../inscriptionActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/inputshadcn";
import { Label } from "@/shared/components/ui/label";

type ManagerData = ComplexWithManager["manager"];

interface EditManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerData | null;
}

// Schema de validación con Zod
const managerSchema = z.object({
  name: z.string().min(3, "El nombre es demasiado corto."),
  email: z.string().email("Debe ser un email válido."),
  phone: z.string().min(8, "El teléfono no parece válido."),
});

type ManagerFormValues = z.infer<typeof managerSchema>;

export const EditManagerModal = ({ isOpen, onClose, manager }: EditManagerModalProps) => {
  const [isPending, startTransition] = useTransition();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManagerFormValues>({
    resolver: zodResolver(managerSchema),
  });

  useEffect(() => {
    // Cuando el manager cambia (al abrir el modal), reseteamos el formulario con sus datos
    if (manager) {
      reset({
        name: manager.name || "",
        email: manager.email || "",
        phone: manager.phone || "",
      });
    }
  }, [manager, reset]);

  const onSubmit = (data: ManagerFormValues) => {
    if (!manager?.id) return;

    startTransition(async () => {
      toast.loading("Actualizando datos del manager...");
      const result = await updateManager(manager.id, data);
      toast.dismiss();

      if (result.success) {
        toast.success("Manager actualizado con éxito.");
        onClose();
      } else {
        toast.error(`Error: ${result.error}`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Manager</DialogTitle>
          <DialogDescription>
            Modificá los datos de contacto de {manager?.name || "este manager"}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input id="name" {...register("name")} className="col-span-3" />
            {errors.name && <p className="col-span-4 text-red-500 text-sm text-right">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" {...register("email")} className="col-span-3" />
            {errors.email && <p className="col-span-4 text-red-500 text-sm text-right">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Teléfono</Label>
            <Input id="phone" {...register("phone")} className="col-span-3" />
            {errors.phone && <p className="col-span-4 text-red-500 text-sm text-right">{errors.phone.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
