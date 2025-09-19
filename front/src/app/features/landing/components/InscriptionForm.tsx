"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inscriptionSchema, InscriptionValues } from "@/lib/inscriptionSchema";
import { CustomInput } from "@/shared/components/ui/Input";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import { SuccessModal } from "@/shared/components/ui/Modal";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

// Opciones para el <select> que coinciden con lo que espera el backend
const planOptions = [
    { value: "Plan Básico", label: "Plan Básico - Demo 30 días" },
    { value: "Plan Estándar", label: "Plan Estándar - Demo 30 días" },
    { value: "Plan Full", label: "Plan Full - Demo 30 días" },
];

export const InscriptionsForm = () => {
  const searchParams = useSearchParams();
  // Buscamos un valor válido en la URL, si no, usamos el primero de la lista como default.
  const planFromUrl = planOptions.find(p => p.value === searchParams.get("plan"))?.value || planOptions[0].value;

  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InscriptionValues>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      selectedPlan: planFromUrl,
    },
  });

  const onSubmit = async (data: InscriptionValues) => {
    setFormError(null);
    try {
      const response = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          "Algo salió mal. Por favor, intenta de nuevo más tarde."
        );
      }

      reset({ selectedPlan: planFromUrl }); 
      setIsSuccessModalOpen(true);
    } catch (error: unknown) {
      console.error("Error al enviar el formulario:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud. Por favor, intenta de nuevo.";

      setFormError(errorMessage);
    }
  };

  return (
    <>
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="¡Solicitud Enviada!"
        message="Gracias por tu interés. Nos pondremos en contacto a la brevedad para configurar tu cuenta."
      />

      <div className="w-full max-w-2xl mx-auto bg-bg-complementario border border-assets  p-8 rounded-xl shadow-sm">
        <div className="text-center mb-8">
          <h2 className="font-lora text-3xl font-semibold text-foreground">
            Solicitá tu Demo de 30 días
          </h2>
          <p className="mt-2 text-paragraph">
            Completá el formulario y nuestro equipo se pondrá en contacto para
            configurar tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomInput
              label="Nombre del Dueño"
              type="text"
              register={register("ownerName")}
              error={errors.ownerName?.message}
            />
            <CustomInput
              label="Email de Contacto"
              type="email"
              register={register("ownerEmail")}
              error={errors.ownerEmail?.message}
            />
          </div>
          <CustomInput
            label="Teléfono de Contacto"
            type="tel"
            register={register("ownerPhone")}
            error={errors.ownerPhone?.message}
          />

          <hr className="my-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomInput
              label="Nombre del Complejo"
              type="text"
              register={register("complexName")}
              error={errors.complexName?.message}
            />
            <CustomInput
              label="Dirección"
              type="text"
              register={register("address")}
              error={errors.address?.message}
            />
            <CustomInput
              label="Ciudad"
              type="text"
              register={register("city")}
              error={errors.city?.message}
            />
            <CustomInput
              label="Provincia"
              type="text"
              register={register("province")}
              error={errors.province?.message}
            />
          </div>
          <CustomInput
            label="Deportes que ofrecés (ej: Fútbol 5, Pádel, Tenis)"
            type="text"
            register={register("sports")}
            error={errors.sports?.message}
          />

          {/* Campo del plan ahora es un <select> */}
          <div className="relative">
            <label className="block text-sm font-medium text-foreground mb-1">
              Plan Seleccionado
            </label>
            <select
              {...register("selectedPlan")}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange appearance-none"
            >
                {planOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          {formError && (
            <p className="text-sm text-red-500 text-center">{formError}</p>
          )}

          <ButtonPrimary
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
          </ButtonPrimary>
        </form>
      </div>
    </>
  );
};
