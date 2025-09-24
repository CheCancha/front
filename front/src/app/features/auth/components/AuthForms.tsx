"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import { PasswordInput, CustomInput } from "@/shared/components/ui/Input";
import { routes } from "@/routes";

// --- Icono de Google ---
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
       {" "}
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    ></path>
       {" "}
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    ></path>
       {" "}
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.487-11.181-8.264l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    ></path>
       {" "}
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.625,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    ></path>
     {" "}
  </svg>
);

// --- Esquema de Validación para Login ---
const loginSchema = z.object({
  phone: z.string().min(1, "El teléfono es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
type LoginValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleRedirect = async () => {
    try {
      const response = await fetch("/api/auth/redirect-after-login");
      if (response.ok) {
        const { redirectUrl } = await response.json();
        router.push(redirectUrl);
        router.refresh();
      } else {
        router.push(routes.public.home);
        router.refresh();
      }
    } catch (e) {
      console.error("Error al determinar redirección:", e);
      router.push(routes.public.home);
      router.refresh();
    }
  };

  const onSubmit = async (data: LoginValues) => {
    setError(null);
    const result = await signIn("credentials", {
      redirect: false,
      phone: data.phone,
      password: data.password,
    });
    if (result?.error) {
      setError("El teléfono o la contraseña son incorrectos.");
    } else {
      await handleRedirect();
    }
  };

  return (
  <div className="w-full">
    <div className="text-center mb-8">
      <h2 className="font-lora text-3xl font-semibold text-gray-900">
        Iniciá sesión en tu cuenta
      </h2>
      <p className="mt-2 text-gray-600">
        ¿Aún no tenés una?{" "}
        <Link
          href={routes.auth.registro}
          className="font-medium text-orange-600 hover:underline"
        >
          Registrate acá
        </Link>
      </p>
    </div>

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <CustomInput
        label="Número de Teléfono"
        type="tel"
        register={register("phone")}
        error={errors.phone?.message}
      />
      <PasswordInput
        label="Contraseña"
        register={register("password")}
        error={errors.password?.message}
      />

      {/* --- INICIO DEL CAMBIO --- */}
      <div className="text-right">
        <Link
          href={routes.public.forgotPassword}
          className="text-sm font-medium text-orange-600 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      {/* --- FIN DEL CAMBIO --- */}

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {/* Se elimina el Link que estaba suelto aquí */}

      <div className="pt-2">
        <ButtonPrimary
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </ButtonPrimary>
      </div>
    </form>

    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-bg-complementario px-3 text-gray-500">
          O continuá con
        </span>
      </div>
    </div>

    <button
      onClick={() => signIn("google")}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 cursor-pointer"
    >
      <GoogleIcon />
      Continuar con Google
    </button>
  </div>
);
}

// --- Esquema de Validación para Registro ---
const registerSchema = z.object({
  name: z.string().min(3, "El nombre es muy corto"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});
type RegisterValues = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const handleRedirect = async () => {
    try {
      const response = await fetch("/api/auth/redirect-after-login");
      if (response.ok) {
        const { redirectUrl } = await response.json();
        router.push(redirectUrl);
        router.refresh();
      } else {
        router.push(routes.public.home);
        router.refresh();
      }
    } catch (e) {
      console.error("Error al determinar redirección:", e);
      router.push(routes.public.home);
      router.refresh();
    }
  };

  const onSubmit = async (data: RegisterValues) => {
    setError(null);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Algo salió mal");
      }

      const result = await signIn("credentials", {
        redirect: false,
        phone: data.phone,
        password: data.password,
      });

      if (result?.error) {
        router.push(routes.auth.ingreso);
      } else {
        await handleRedirect();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado");
      }
    }
  };

  return (
    <div className="w-full ">
      <div className="text-center mb-8">
        <h2 className="font-lora text-3xl font-semibold text-foreground">
          Creá tu cuenta
        </h2>
        <p className="mt-2 text-paragraph">
          ¿Ya tenés una?
          <Link
            href="/login"
            className="font-medium text-brand-orange hover:underline"
          >
            {" "}
            Iniciá sesión
          </Link>
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <CustomInput
          label="Nombre Completo"
          type="text"
          register={register("name")}
          error={errors.name?.message}
        />
        <CustomInput
          label="Número de Teléfono"
          type="tel"
          register={register("phone")}
          error={errors.phone?.message}
        />
        <PasswordInput
          label="Contraseña"
          register={register("password")}
          error={errors.password?.message}
        />
         {error && <p className="text-sm text-red-600">{error}</p>}   
        <ButtonPrimary type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
        </ButtonPrimary>
      </form>
    </div>
  );
};
