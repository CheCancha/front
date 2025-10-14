"use client";

import React from "react";
import { FullComplexData } from "@/shared/entities/complex/types";
interface GeneralInfoFormProps {
  data: FullComplexData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FormField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  note,
  step,
}: {
  id: keyof FullComplexData;
  label: string;
  value: string | number | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  note?: string;
  step?: string;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      step={step}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
    />
    {note && <p className="mt-2 text-xs text-gray-500">{note}</p>}
  </div>
);

export const GeneralInfoForm: React.FC<GeneralInfoFormProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-10">
      {/* --- Sección de Información Básica --- */}
      <div>
        <h3 className="text-lg font-semibold leading-6 text-brand-dark">Información Básica</h3>
        <p className="mt-1 text-sm text-gray-500">Datos principales que identifican a tu complejo.</p>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <FormField id="name" label="Nombre del Complejo" value={data.name} onChange={onChange} required />
          </div>
          <div className="sm:col-span-6">
            <FormField id="address" label="Dirección" value={data.address} onChange={onChange} required />
          </div>
          <div className="sm:col-span-3">
            <FormField id="city" label="Ciudad" value={data.city} onChange={onChange} required />
          </div>
          <div className="sm:col-span-3">
            <FormField id="province" label="Provincia" value={data.province} onChange={onChange} required />
          </div>
        </div>
      </div>

      {/* --- Sección de Contacto Público y Redes --- */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-semibold leading-6 text-brand-dark">Contacto y Redes Sociales</h3>
        <p className="mt-1 text-sm text-gray-500">Esta información será visible en tu perfil público para que los jugadores puedan contactarte.</p>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <FormField id="contactPhone" label="Teléfono Público" value={data.contactPhone} onChange={onChange} placeholder="3491123456" />
          </div>
          <div className="sm:col-span-3">
            <FormField id="contactEmail" label="Email Público" type="email" value={data.contactEmail} onChange={onChange} placeholder="contacto@tuclub.com" />
          </div>
          <div className="sm:col-span-3">
            <FormField id="instagramHandle" label="Usuario de Instagram" value={data.instagramHandle} onChange={onChange} placeholder="tuclubdeportivo" note="Solo el nombre de usuario, sin el @" />
          </div>
          <div className="sm:col-span-3">
            <FormField id="facebookUrl" label="URL de Facebook" value={data.facebookUrl} onChange={onChange} placeholder="https://facebook.com/tuclub" />
          </div>
        </div>
      </div>

      {/* --- Sección de Ubicación en el Mapa --- */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-semibold leading-6 text-brand-dark">Ubicación en el Mapa</h3>
        <p className="mt-1 text-sm text-gray-500">Coordenadas para mostrar tu complejo en el mapa del perfil. Podés obtenerlas fácilmente desde Google Maps.</p>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <FormField id="latitude" label="Latitud" type="number" step="any" value={data.latitude} onChange={onChange} placeholder="-29.2345" />
          </div>
          <div className="sm:col-span-3">
            <FormField id="longitude" label="Longitud" type="number" step="any" value={data.longitude} onChange={onChange} placeholder="-61.7689" />
          </div>
        </div>
      </div>
    </div>
  );
};