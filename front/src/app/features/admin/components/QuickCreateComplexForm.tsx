"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SubscriptionPlan } from "@prisma/client";
import { CustomInput } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/components/ui/select";
import { toast } from "react-hot-toast";
import { Spinner } from "@/shared/components/ui/Spinner";

const onboardSchema = z.object({
  managerName: z.string().min(3, "Nombre requerido"),
  managerEmail: z.string().email("Email inválido"),
  managerPhone: z.string().optional(),
  complexName: z.string().min(3, "Nombre complejo requerido"),
  address: z.string().min(3, "Dirección requerida"),
  city: z.string().min(3, "Ciudad requerida"),
  province: z.string().min(3, "Provincia requerida"),
  plan: z.nativeEnum(SubscriptionPlan), 
});
type OnboardValues = z.infer<typeof onboardSchema>;

interface QuickCreateComplexFormProps {
  onSuccess?: () => void;
}

export const QuickCreateComplexForm: React.FC<QuickCreateComplexFormProps> = ({ onSuccess }) => {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<OnboardValues>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      plan: SubscriptionPlan.BASE,
    },
  });

  const onSubmit = async (data: OnboardValues) => {
    setFormError(null);
    try {
      const response = await fetch("/api/admin/onboard-complex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al crear el complejo.");
      }
      
      toast.success(result.message || "Complejo creado con éxito!");
      reset();
      if (onSuccess) onSuccess(); 

    } catch (error: unknown) {
      console.error("Error en Quick Create:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear el complejo.";
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };
  
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">Datos del Manager</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CustomInput label="Nombre Manager" register={register("managerName")} error={errors.managerName?.message} />
        <CustomInput label="Email Manager" type="email" register={register("managerEmail")} error={errors.managerEmail?.message} />
        <CustomInput label="Teléfono (Opcional)" type="tel" register={register("managerPhone")} error={errors.managerPhone?.message} />
      </div>

      <h3 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4 pt-4">Datos del Complejo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomInput label="Nombre Complejo" register={register("complexName")} error={errors.complexName?.message} />
        <Controller
          name="plan"
          control={control}
          render={({ field }) => (
            <div>
              <label className={labelClass}>Plan Inicial (con prueba)</label>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Seleccionar plan..." /></SelectTrigger>
                <SelectContent>
                  {Object.values(SubscriptionPlan).map(planValue => (
                    <SelectItem key={planValue} value={planValue}>
                      {planValue} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.plan && <p className="mt-1 text-sm text-red-600">{errors.plan.message}</p>}
            </div>
          )}
        />
      </div>
      <CustomInput label="Dirección" register={register("address")} error={errors.address?.message} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomInput label="Ciudad" register={register("city")} error={errors.city?.message} />
        <CustomInput label="Provincia" register={register("province")} error={errors.province?.message} />
      </div>

      {formError && <p className="text-sm text-red-600 text-center">{formError}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          {isSubmitting ? "Creando Cuenta..." : "Crear Cuenta y Enviar Acceso"}
        </Button>
      </div>
    </form>
  );
};