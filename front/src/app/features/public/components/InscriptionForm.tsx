"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  inscriptionSchema,
  InscriptionValues,
} from "@/shared/lib/inscriptionSchema";
import { CustomInput } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/button";
import { SuccessModal } from "@/shared/components/ui/Modal";
import { type Sport } from "@prisma/client";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import Link from "next/link";

const planOptions = [
  { value: "Plan Básico", label: "Plan Básico" },
  { value: "Plan Pro", label: "Plan Pro" },
];

const steps = [
  { id: 1, name: "Tus Datos", fields: ["ownerName", "ownerEmail", "ownerPhone"] },
  { id: 2, name: "Tu Complejo", fields: ["complexName", "address", "city", "province", "sports"] },
  { id: 3, name: "Finalizar", fields: ["selectedCycle", "selectedPlan", "terms"] },
];

export const InscriptionsForm = () => {
  const searchParams = useSearchParams();
  const planFromUrl = planOptions.find((p) => p.value === searchParams.get("plan"))?.value || planOptions[0].value;

  const [currentStep, setCurrentStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [sportOptions, setSportOptions] = useState<{ value: string; label: string }[]>([]);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InscriptionValues>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      selectedPlan: planFromUrl,
      selectedCycle: "MENSUAL",
      sports: "",
      terms: false,
    },
  });

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await fetch("/api/sports");
        if (!response.ok) throw new Error("La respuesta de la red no fue correcta");
        const data: Sport[] = await response.json();
        const options = data.map((sport) => ({
          value: sport.name,
          label: sport.name,
        }));
        setSportOptions(options);
      } catch (error) {
        console.error("No se pudieron cargar los deportes", error);
      }
    };
    fetchSports();
  }, []);

  const processForm = async (data: InscriptionValues) => {
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
      reset();
      setCurrentStep(0); // Volver al primer paso después de enviar
      setIsSuccessModalOpen(true);
    } catch (error: unknown) {
      console.error("Error al enviar el formulario:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud.";
      setFormError(errorMessage);
    }
  };

  type FieldName = keyof InscriptionValues;

  const nextStep = async () => {
    const fields = steps[currentStep].fields as FieldName[];
    const output = await trigger(fields, { shouldFocus: true });
    if (!output) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
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

      <div className="w-full max-w-3xl pt-16 px-4 mx-auto bg-white">
        {/* --- Indicador de Pasos --- */}
        <div className="mb-10">
          <ul className="flex items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.name}>
                <li className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${currentStep > index ? 'bg-brand-orange text-white' : currentStep === index ? 'border-2 border-brand-orange text-brand-orange' : 'border-2 border-gray-300 text-gray-500'}`}>
                    {currentStep > index ? <Check size={18}/> : step.id}
                  </div>
                  <span className={`ml-3 text-sm font-medium hidden sm:block transition-colors duration-300 ${currentStep >= index ? 'text-brand-dark' : 'text-gray-500'}`}>{step.name}</span>
                </li>
                {index < steps.length - 1 && <div className="flex-1 mx-4 h-0.5 bg-gray-200"></div>}
              </React.Fragment>
            ))}
          </ul>
        </div>


        <form onSubmit={handleSubmit(processForm)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* --- Paso 1: Datos del Dueño --- */}
              {currentStep === 0 && (
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800">Paso 1: Tus Datos</h3>
                  <CustomInput label="Nombre y Apellido" register={register("ownerName")} error={errors.ownerName?.message} />
                  <CustomInput label="Email" type="email" register={register("ownerEmail")} error={errors.ownerEmail?.message} />
                  <CustomInput label="Teléfono de Contacto" type="tel" register={register("ownerPhone")} error={errors.ownerPhone?.message} />
                </section>
              )}

              {/* --- Paso 2: Datos del Complejo --- */}
              {currentStep === 1 && (
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800">Paso 2: Datos de tu Complejo</h3>
                  <CustomInput label="Nombre del Complejo" register={register("complexName")} error={errors.complexName?.message} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomInput label="Dirección" register={register("address")} error={errors.address?.message} />
                    <CustomInput label="Ciudad" register={register("city")} error={errors.city?.message} />
                  </div>
                  <CustomInput label="Provincia" register={register("province")} error={errors.province?.message} />
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
                                        const isChecked = typeof field.value === 'string' && field.value.includes(sport.value);
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
                </section>
              )}

              {/* --- Paso 3: Plan y Finalización --- */}
              {currentStep === 2 && (
                <section className="space-y-8">
                  <h3 className="text-xl font-semibold text-gray-800">Paso 3: ¡Casi listo!</h3>
                  <Controller
                    control={control}
                    name="selectedCycle"
                    render={({ field }) => (
                      <div>
                        <label className={labelClass}>Frecuencia de Pago</label>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label htmlFor="monthly" className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${field.value === 'MENSUAL' ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-gray-200 hover:border-gray-300'}`}>
                              {field.value === 'MENSUAL' && (<div className="absolute top-2 right-2 w-5 h-5 bg-brand-orange rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>)}
                              <RadioGroupItem value="MENSUAL" id="monthly" className="sr-only" />
                              <span className="font-semibold text-gray-800">Mensual</span>
                              <span className="text-sm text-gray-500 mt-1">Ideal para empezar.</span>
                          </label>
                          <label htmlFor="annual" className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${field.value === 'ANUAL' ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-gray-200 hover:border-gray-300'}`}>
                              <div className="absolute top-2 right-2 bg-[#99f264] text-[#265314] text-xs font-bold px-2 py-0.5 rounded-full">AHORRÁ 2 MESES</div>
                              {field.value === 'ANUAL' && (<div className="absolute top-2 right-2 w-5 h-5 bg-brand-orange rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>)}
                              <RadioGroupItem value="ANUAL" id="annual" className="sr-only" />
                              <span className="font-semibold text-gray-800">Anual</span>
                              <span className="text-sm text-gray-500 mt-1">Jugá todo el año con ventaja.</span>
                          </label>
                        </RadioGroup>
                        {errors.selectedCycle && <p className="mt-1 text-sm text-red-600">{errors.selectedCycle.message}</p>}
                      </div>
                    )}
                  />
                  <div>
                    <label className={labelClass}>Plan Seleccionado (90 días Demo)</label>
                    <Controller name="selectedPlan" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccioná un plan..." /></SelectTrigger>
                            <SelectContent>
                                {planOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    )} />
                    {errors.selectedPlan && <p className="mt-1 text-sm text-red-600">{errors.selectedPlan.message}</p>}
                  </div>
                    <div>
                        <Controller name="terms" control={control} render={({ field }) => (
                            <div className="flex items-start space-x-3 mt-4">
                                <Checkbox id="terms" checked={field.value} onCheckedChange={field.onChange} />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Acepto los <Link href="/terms" target="_blank" className="underline text-brand-orange hover:text-brand-orange/80">Términos y Condiciones</Link>
                                    </label>
                                </div>
                            </div>
                        )} />
                        {errors.terms && <p className="mt-2 text-sm text-red-600">{errors.terms.message}</p>}
                    </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
          
          {formError && <p className="text-sm text-red-600 text-center mt-4">{formError}</p>}

          {/* --- Botones de Navegación --- */}
          <div className="mt-8 pt-5">
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
              </Button>
              {currentStep < steps.length - 1 && (
                <Button type="button" onClick={nextStep}>
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
};