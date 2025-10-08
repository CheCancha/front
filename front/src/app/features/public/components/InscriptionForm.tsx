"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inscriptionSchema, InscriptionValues } from "@/shared/lib/inscriptionSchema";
import { CustomInput } from "@/shared/components/ui/Input";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import { SuccessModal } from "@/shared/components/ui/Modal";
import { Sport } from "@prisma/client";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";


interface PlanOption {
    value: string;
    label: string;
}

const planOptions: PlanOption[] = [
    { value: "Plan Básico", label: "Plan Básico" },
    { value: "Plan Pro", label: "Plan Pro" },
];

interface SportOption {
    value: string;
    label: string;
}

export const InscriptionsForm = () => {
  const searchParams = useSearchParams();
  const planFromUrl = planOptions.find(p => p.value === searchParams.get("plan"))?.value || planOptions[0].value;

  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [sportOptions, setSportOptions] = useState<SportOption[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InscriptionValues>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      selectedPlan: planFromUrl,
      selectedCycle: 'MENSUAL',
      sports: '', // <-- SOLUCIÓN: Añadido valor por defecto
    },
  });

  useEffect(() => {
    const fetchSports = async () => {
        try {
            const response = await fetch('/api/sports');
            if (!response.ok) throw new Error("Network response was not ok");
            const data: Sport[] = await response.json();
            const options = data.map(sport => ({ value: sport.name, label: sport.name }));
            setSportOptions(options);
        } catch (error) {
            console.error("No se pudieron cargar los deportes", error);
        }
    };
    fetchSports();
  }, []);

  const onSubmit = async (data: InscriptionValues) => {
    setFormError(null);
    try {
      const response = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Algo salió mal. Por favor, intenta de nuevo más tarde.");
      }
      reset({ selectedPlan: planFromUrl, selectedCycle: 'MENSUAL', sports: '' });
      setIsSuccessModalOpen(true);
    } catch (error: unknown) {
      console.error("Error al enviar el formulario:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo enviar la solicitud.";
      setFormError(errorMessage);
    }
  };

  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <>
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="¡Solicitud Enviada!"
        message="Gracias por tu interés. Nos pondremos en contacto a la brevedad para configurar tu cuenta."
      />

      <div className="w-full max-w-3xl mx-auto bg-white">
        <div className="text-center mb-10">
          <h2 className="font-lora text-3xl font-bold text-gray-900">
            Solicitá tu Demo de 90 días
          </h2>
          <p className="mt-2 text-gray-600">
            Completá el formulario y nuestro equipo se pondrá en contacto para configurar tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* --- Sección Datos del Dueño --- */}
          <section className="space-y-4 bg-gray-50 p-6 rounded-lg border">
            <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-800">Datos del Dueño</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomInput label="Nombre y Apellido" type="text" register={register("ownerName")} error={errors.ownerName?.message}/>
              <CustomInput label="Email" type="email" register={register("ownerEmail")} error={errors.ownerEmail?.message}/>
            </div>
            <CustomInput label="Teléfono de Contacto" type="tel" register={register("ownerPhone")} error={errors.ownerPhone?.message}/>
          </section>

          {/* --- Sección Datos del Complejo --- */}
          <section className="space-y-6 bg-gray-50 p-6 rounded-lg border">
             <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-800">Datos del Complejo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomInput label="Nombre del Complejo" type="text" register={register("complexName")} error={errors.complexName?.message}/>
              <CustomInput label="Dirección" type="text" register={register("address")} error={errors.address?.message}/>
              <CustomInput label="Ciudad" type="text" register={register("city")} error={errors.city?.message}/>
              <CustomInput label="Provincia" type="text" register={register("province")} error={errors.province?.message}/>
            </div>
            
            <div>
              <label className={labelClass}>Deportes que ofrecés</label>
                <Controller
                    name="sports"
                    control={control}
                    render={({ field }) => (
                        <div className="mt-2 space-y-2 rounded-lg border p-4">
                            <p className="text-sm text-gray-500 mb-3">Seleccioná todos los que apliquen.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {sportOptions.map((sport) => {
                                    const isChecked = field.value?.includes(sport.value) ?? false;
                                    return (
                                        <div key={sport.value} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`sport-${sport.value}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => {
                                                    const currentSports = field.value ? field.value.split(', ') : [];
                                                    const filteredSports = currentSports.filter(s => s); 
                                                    const newSports = checked
                                                        ? [...filteredSports, sport.value]
                                                        : filteredSports.filter((s) => s !== sport.value);
                                                    field.onChange(newSports.join(', '));
                                                }}
                                            />
                                            <label htmlFor={`sport-${sport.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {sport.label}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                />
                {errors.sports && <p className="mt-1 text-sm text-red-600">{errors.sports.message}</p>}
            </div>

            <Controller
              control={control}
              name="selectedCycle"
              render={({ field }) => (
                <div>
                  <label className={labelClass}>Frecuencia de Pago</label>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <label
                      htmlFor="monthly"
                      className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        field.value === 'MENSUAL' ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {field.value === 'MENSUAL' && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-brand-orange rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <RadioGroupItem value="MENSUAL" id="monthly" className="sr-only" />
                      <span className="font-semibold text-gray-800">Mensual</span>
                      <span className="text-sm text-gray-500 mt-1">Ideal para empezar.</span>
                    </label>
                    <label
                      htmlFor="annual"
                      className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        field.value === 'ANUAL' ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        AHORRÁ 2 MESES
                      </div>
                      {field.value === 'ANUAL' && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-brand-orange rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <RadioGroupItem value="ANUAL" id="annual" className="sr-only" />
                      <span className="font-semibold text-gray-800">Anual</span>
                      <span className="text-sm text-gray-500 mt-1">Pagá 10 meses y usá 12.</span>
                    </label>
                  </RadioGroup>
                  {errors.selectedCycle && <p className="mt-1 text-sm text-red-600">{errors.selectedCycle.message}</p>}
                </div>
              )}
            />
            
            <div>
                <label className={labelClass}>Plan Seleccionado (90 dias Demo)</label>
                <Controller
                    name="selectedPlan"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Seleccioná un plan..." />
                            </SelectTrigger>
                            <SelectContent>
                                {planOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.selectedPlan && <p className="mt-1 text-sm text-red-600">{errors.selectedPlan.message}</p>}
            </div>
          </section>
          
          {formError && (<p className="text-sm text-red-600 text-center">{formError}</p>)}

          <ButtonPrimary type="submit" className="text-base py-3" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
          </ButtonPrimary>
        </form>
      </div>
    </>
  );
};