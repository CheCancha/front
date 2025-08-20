"use client";
import { useState } from "react";
import { useField } from "formik";
import clsx from "clsx";
import { Eye, EyeClosed } from 'lucide-react';
interface CustomInputProps {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
}

export const CustomInput = ({ label, ...props }: CustomInputProps) => {
  const [field, meta] = useField(props);

  return (
    <div>
      <label
        htmlFor={props.name}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="mt-1">
        <input
          {...field}
          {...props}
          className={clsx(
            "block w-full px-2 py-3 rounded-md border bg-white sm:text-sm",
            {
              "border-red-700": meta.touched && meta.error,
              "border-gray-300": !(meta.touched && meta.error),
            }
          )}
        />
        {meta.touched && meta.error ? (
          <p className="mt-2 text-sm text-red-600">{meta.error}</p>
        ) : null}
      </div>
    </div>
  );
};



interface PasswordInputProps {
  label: string;
  name: string;
  placeholder?: string;
}

export const PasswordInput = ({ label, ...props }: PasswordInputProps) => {
  const [field, meta] = useField(props);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      <label
        htmlFor={props.name}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="mt-1 relative">
        <input
          {...field}
          {...props}
          type={showPassword ? "text" : "password"} 
          className={clsx(
            "block w-full px-2 py-3 pr-10 rounded-md border bg-white sm:text-sm",
            {
              "border-red-700": meta.touched && meta.error,
              "border-gray-300": !(meta.touched && meta.error),
            }
          )}
        />
        {/* Botón para mostrar/ocultar la contraseña */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">{meta.error}</p>
      ) : null}
    </div>
  );
};