"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CustomInput } from '@/shared/components/ui/Input';
import { ButtonPrimary } from '@/shared/components/ui/Buttons';

const inscriptionSchema = z.object({
  ownerName: z.string().min(3, "El nombre es muy corto"),
  ownerPhone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  ownerEmail: z.string().email("El email no es válido"),
  complexName: z.string().min(3, "El nombre del complejo es muy corto"),
  address: z.string().min(5, "La dirección es muy corta"),
  city: z.string().min(3, "La ciudad es muy corta"),
  province: z.string().min(3, "La provincia es muy corta"),
  sports: z.string().min(3, "Menciona al menos un deporte"),
  selectedPlan: z.string(),
});

type InscriptionValues = z.infer<typeof inscriptionSchema>;

export const InscriptionsForm = () => {
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan') || 'No seleccionado';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InscriptionValues>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      selectedPlan: planFromUrl,
    },
  });

  const onSubmit = async (data: InscriptionValues) => {
    // Aquí iría la lógica para enviar los datos por email o a una API
    console.log(data);
    alert(`Solicitud enviada para el plan: ${data.selectedPlan}. ¡Gracias! Nos pondremos en contacto a la brevedad.`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-bg-complementario border border-assets  p-8 rounded-xl shadow-sm">
      <div className="text-center mb-8">
        <h2 className="font-lora text-3xl font-semibold text-foreground">Solicitá tu Demo de 30 días</h2>
        <p className="mt-2 text-paragraph">Completá el formulario y nuestro equipo se pondrá en contacto para configurar tu cuenta.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CustomInput label="Nombre del Dueño" type="text" register={register('ownerName')} error={errors.ownerName?.message} />
          <CustomInput label="Email de Contacto" type="email" register={register('ownerEmail')} error={errors.ownerEmail?.message} />
        </div>
        <CustomInput label="Teléfono de Contacto" type="tel" register={register('ownerPhone')} error={errors.ownerPhone?.message} />
        
        <hr className="my-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CustomInput label="Nombre del Complejo" type="text" register={register('complexName')} error={errors.complexName?.message} />
          <CustomInput label="Dirección" type="text" register={register('address')} error={errors.address?.message} />
          <CustomInput label="Ciudad" type="text" register={register('city')} error={errors.city?.message} />
          <CustomInput label="Provincia" type="text" register={register('province')} error={errors.province?.message} />
        </div>
        <CustomInput label="Deportes que ofrecés (ej: Fútbol 5, Pádel, Tenis)" type="text" register={register('sports')} error={errors.sports?.message} />
        
        {/* Campo del plan seleccionado (solo lectura) */}
        <div>
          <label className="block text-sm font-medium text-foreground">Plan Seleccionado</label>
          <input 
            type="text" 
            {...register('selectedPlan')}
            readOnly 
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        
        <ButtonPrimary type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
        </ButtonPrimary>
      </form>
    </div>
  );
};
