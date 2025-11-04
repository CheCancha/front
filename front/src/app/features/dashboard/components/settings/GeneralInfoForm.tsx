"use client";

import React from "react";
import { FullComplexData } from "@/shared/entities/complex/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface GeneralInfoFormProps {
  data: FullComplexData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (
    index: number,
    field: "phone" | "label",
    value: string
  ) => void;
  onAddPhone: () => void;
  onRemovePhone: (index: number) => void;
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
    {note && <p className="mt-2 text-xs text-paragraph">{note}</p>}
  </div>
);

export const GeneralInfoForm: React.FC<GeneralInfoFormProps> = ({
  data,
  onChange,
  // --- NUEVAS PROPS ---
  onPhoneChange,
  onAddPhone,
  onRemovePhone,
}) => {
  return (
    <div className="space-y-10">
      {/* --- Sección de Información Básica --- */}
      <div>
        <h3 className="text-lg font-switzer font-semibold leading-6 text-brand-dark">
          Información Básica
        </h3>
        <p className="mt-1 text-sm text-paragraph">
          Datos principales que identifican a tu complejo.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <FormField
              id="name"
              label="Nombre del Complejo"
              value={data.name}
              onChange={onChange}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <FormField
              id="address"
              label="Dirección"
              value={data.address}
              onChange={onChange}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <FormField
              id="city"
              label="Ciudad"
              value={data.city}
              onChange={onChange}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <FormField
              id="province"
              label="Provincia"
              value={data.province}
              onChange={onChange}
              required
            />
          </div>
        </div>
      </div>

      {/* --- Sección de Contacto Público y Redes --- */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-switzer font-semibold leading-6 text-brand-dark">
          Contacto y Redes Sociales
        </h3>
        <p className="mt-1 text-sm text-paragraph">
          Esta información será visible en tu perfil público para que los
          jugadores puedan contactarte.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700">
              Teléfonos Públicos
            </label>
            <div className="mt-2 space-y-3">
              {(data.contactPhones || []).map((phone, index) => (
                <div
                  key={phone.id || `new-${index}`}
                  className="flex items-center space-x-2"
                >
                  {/* Input para el Número */}
                  <input
                    type="tel"
                    placeholder="Número (ej: 3491123456)"
                    value={phone.phone}
                    onChange={(e) =>
                      onPhoneChange(index, "phone", e.target.value)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                  />

                  <Select
                    value={phone.label || "none"}
                    onValueChange={(value) =>
                      onPhoneChange(
                        index,
                        "label",
                        value === "none" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger className="w-1/2">
                      <SelectValue placeholder="Sin etiqueta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin Etiqueta</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Fijo">Tel. Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Botón de Eliminar */}
                  <button
                    type="button"
                    onClick={() => onRemovePhone(index)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {/* Botón de Agregar */}
              <button
                type="button"
                onClick={onAddPhone}
                className="mt-2 flex items-center px-3 py-2 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Agregar Teléfono
              </button>
            </div>
          </div>

          <div className="sm:col-span-3">
            <FormField
              id="contactEmail"
              label="Email Público"
              type="email"
              value={data.contactEmail}
              onChange={onChange}
              placeholder="contacto@tuclub.com"
            />
          </div>
          <div className="sm:col-span-3">
            <FormField
              id="instagramHandle"
              label="Usuario de Instagram"
              value={data.instagramHandle}
              onChange={onChange}
              placeholder="tuclubdeportivo"
              note="Solo el nombre de usuario, sin el @"
            />
          </div>
          <div className="sm:col-span-3">
            <FormField
              id="facebookUrl"
              label="URL de Facebook"
              value={data.facebookUrl}
              onChange={onChange}
              placeholder="https://facebook.com/tuclub"
            />
          </div>
        </div>
      </div>

      {/* --- Sección de Ubicación en el Mapa --- */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-switzer font-semibold leading-6 text-brand-dark">
          Ubicación en el Mapa
        </h3>
        <p className="mt-1 text-sm text-paragraph">
          Coordenadas para mostrar tu complejo en el mapa del perfil. Podés
          obtenerlas fácilmente desde Google Maps.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <FormField
              id="latitude"
              label="Latitud"
              type="number"
              step="any"
              value={data.latitude}
              onChange={onChange}
              placeholder="-29.2345"
            />
          </div>
          <div className="sm:col-span-3">
            <FormField
              id="longitude"
              label="Longitud"
              type="number"
              step="any"
              value={data.longitude}
              onChange={onChange}
              placeholder="-61.7689"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
