"use client";

import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CustomInput, PasswordInput } from "@/shared/components/ui/Input";

interface RegisterFormValues {
  name: string;
  phone: string;
  address: string;
  password: string;
}

const RegisterSchema = Yup.object({
  name: Yup.string()
    .min(3, "El nombre es muy corto")
    .required("El nombre es obligatorio"),
  phone: Yup.string()
    .matches(/^[0-9]+$/, "Solo se admiten números")
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .required("El número de teléfono es obligatorio"),
  address: Yup.string()
    .min(5, "La dirección parece muy corta")
    .required("La dirección es obligatoria"),
  password: Yup.string()
    .min(5, "La contraseña debe tener al menos 5 caracteres")
    .required("La contraseña es obligatoria"),
});

const GuestConversionSchema = Yup.object({
  password: Yup.string()
    .min(5, "La contraseña debe tener al menos 5 caracteres")
    .required("La contraseña es obligatoria"),
});

export const RegisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<RegisterFormValues>({
    name: "",
    phone: "",
    address: "",
    password: "",
  });

  const [isGuestConversion, setIsGuestConversion] = useState(false);

  useEffect(() => {
    const guestDataString = sessionStorage.getItem("guestDataForRegistration");
    if (guestDataString) {
      const guestData = JSON.parse(guestDataString);
      setInitialValues({
        name: guestData.name,
        phone: guestData.phone,
        address: guestData?.address || "",
        password: "",
      });
      setIsGuestConversion(true);
      sessionStorage.removeItem("guestDataForRegistration");
    }
  }, []);

  return (
    <div className="w-full max-w-md">
      <h2 className="text-center text-3xl font-bold ...">
        {isGuestConversion ? "Completá tu registro" : "Creá tu cuenta"}
      </h2>
      {isGuestConversion && (
        <p className="mt-2 text-gray-600">
          ¡Ya casi estás! Solo necesitás crear una contraseña y añadir tu
          dirección.
        </p>
      )}

      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={
          isGuestConversion ? GuestConversionSchema : RegisterSchema
        }
        onSubmit={async (values, { setSubmitting }) => {
          setError(null);
          try {
            // 1. Enviamos los datos a nuestra API de registro
            const response = await fetch("/api/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });

            if (!response.ok) {
              const errorData = await response.text();
              throw new Error(errorData || "Ocurrió un error al registrar.");
            }

            // 2. Si el registro es exitoso, iniciamos sesión automáticamente
            const signInResponse = await signIn("credentials", {
              phone: values.phone,
              password: values.password,
              redirect: false,
            });

            if (signInResponse?.error) {
              throw new Error("Error al iniciar sesión después del registro.");
            }

            router.push("/");
            router.refresh();
          } catch (err) {
            if (err instanceof Error) {
              setError(err.message);
            } else {
              setError("Ocurrió un error inesperado.");
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isValid, dirty, isSubmitting }) => (
          <Form className="mt-8 space-y-6">
            {isGuestConversion ? (
              <div className="space-y-2 rounded-md bg-slate-50 p-4 border border-slate-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Nombre:</span>{" "}
                  {initialValues.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Teléfono:</span>{" "}
                  {initialValues.phone}
                </p>
              </div>
            ) : (
              <>
                <CustomInput
                  label="Nombre Completo"
                  name="name"
                  type="text"
                  placeholder="Tu nombre y apellido"
                />
                <CustomInput
                  label="Número de WhatsApp"
                  name="phone"
                  type="tel"
                  placeholder="3491547021"
                />
              </>
            )}

            <CustomInput
              label="Dirección de Envío"
              name="address"
              type="text"
              placeholder="Calle Falsa 123, Tostado"
            />
            <PasswordInput
              label="Contraseña"
              name="password"
              placeholder="Tu contraseña"
            />

            {/* Mostramos el mensaje de error si existe */}
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={!dirty || !isValid || isSubmitting}
              className="w-full cursor-pointer rounded-md border border-transparent bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Registrando..."
                : isGuestConversion
                ? "Finalizar registro"
                : "Crear cuenta"}
            </button>
          </Form>
        )}
      </Formik>

      <p className="mt-6 text-center text-neutral-800">
        ¿Ya tenés una cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
};
