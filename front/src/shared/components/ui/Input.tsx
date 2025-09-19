"use client";
import React, { useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Eye, EyeClosed } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
}

export const CustomInput: React.FC<InputProps> = ({ label, register, error, type = 'text', ...props }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        {...register}
        {...props}
        className={cn(
          "mt-1 block w-full px-3 py-2 bg-background border rounded-md shadow-xs focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm",
          error ? "border-red-500" : "border-gray-300"
        )}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};


export const PasswordInput: React.FC<InputProps> = ({ label, register, error, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="relative mt-1">
        <input
          type={showPassword ? 'text' : 'password'}
          {...register}
          {...props}
          className={cn(
            "block w-full px-3 py-2 border bg-background rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm",
            error ? "border-red-500" : "border-gray-300"
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
        >
          {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};