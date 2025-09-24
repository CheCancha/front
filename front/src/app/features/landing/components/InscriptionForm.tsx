"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { inscriptionSchema, InscriptionValues } from "@/shared/lib/inscriptionSchema";
import { CustomInput } from "@/shared/components/ui/Input";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import { SuccessModal } from "@/shared/components/ui/Modal";
import { Sport } from "@prisma/client";

interface PlanOption {
    value: string;
    label: string;
}

const planOptions: PlanOption[] = [
    { value: "Plan Básico", label: "Plan Básico" },
    { value: "Plan Estándar", label: "Plan Estándar" },
    { value: "Plan Full", label: "Plan Full" },
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
      reset({ selectedPlan: planFromUrl });
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

      <div className="w-full max-w-3xl mx-auto bg-white border border-gray-200 p-8 rounded-xl shadow-lg">
        <div className="text-center mb-10">
          <h2 className="font-lora text-3xl font-bold text-gray-900">
            Solicitá tu Demo de 30 días
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
              <CustomInput label="Email de Contacto" type="email" register={register("ownerEmail")} error={errors.ownerEmail?.message}/>
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
                        <Select
                            isMulti
                            instanceId="sports-select-inscription"
                            options={sportOptions}
                            className="mt-1"
                            classNamePrefix="react-select"
                            placeholder="Seleccioná uno o más deportes..."
                            value={sportOptions.filter(option => field.value?.includes(option.value))}
                            onChange={selectedOptions => field.onChange(selectedOptions.map(opt => opt.value).join(', '))}
                        />
                    )}
                />
                {errors.sports && <p className="mt-1 text-sm text-red-600">{errors.sports.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Plan Seleccionado</label>
              <Controller
                name="selectedPlan"
                control={control}
                render={({ field }) => (
                  <Select<PlanOption>
                    instanceId="plan-select-inscription"
                    options={planOptions}
                    className="mt-1"
                    classNamePrefix="react-select"
                    placeholder="Seleccioná un plan..."
                    value={planOptions.find(option => option.value === field.value)}
                    onChange={selectedOption => field.onChange(selectedOption ? selectedOption.value : '')}
                  />
                )}
              />
               {errors.selectedPlan && <p className="mt-1 text-sm text-red-600">{errors.selectedPlan.message}</p>}
            </div>
          </section>
          
          {formError && (<p className="text-sm text-red-600 text-center">{formError}</p>)}

          <ButtonPrimary type="submit" className="w-full text-base py-3" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
          </ButtonPrimary>
        </form>
      </div>
    </>
  );
};

