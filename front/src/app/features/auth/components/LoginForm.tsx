"use client";

import { signIn } from "next-auth/react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { CustomInput, PasswordInput } from "@/shared/components/ui/Input";
import { useRouter } from "next/navigation";
import { routes } from "@/routes";

const LoginSchema = Yup.object({
  phone: Yup.string()
    .matches(/^[0-9]+$/, "Solo se admiten números")
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .required("El número de teléfono es obligatorio"),
  password: Yup.string().required("La contraseña es obligatoria"),
});

// Interfaz para los valores del formulario
interface LoginValues {
  phone: string;
  password: string;
}

const LoginForm = () => {
  const router = useRouter();
  const initialValues: LoginValues = {
    phone: "",
    password: "",
  };

  return (
    <div className="w-full max-w-md ">
      <div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Iniciá sesión en tu cuenta
        </h2>
        <p className="text-center text-neutral-800 mb-6">
          {" "}
          ¿Aún no tenés una?{" "}
          <Link
            href={routes.register}
            className="font-medium text-primary hover:underline"
          >
            Registrate acá
          </Link>
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={LoginSchema}
        onSubmit={async (values, { setSubmitting }) => {
          // 2. Llama a la función signIn
          const result = await signIn("credentials", {
            redirect: false,
            phone: values.phone,
            password: values.password,
          });

          if (result?.error) {
            console.error("Error de inicio de sesión:", result.error);
            alert("Credenciales incorrectas. Inténtalo de nuevo.");
          } else {
            router.push("/");
          }
          setSubmitting(false);
        }}
      >
        {({ isValid, dirty, isSubmitting }) => (
          <Form className="mt-8 space-y-6">
            <CustomInput
              label="Número de WhatsApp"
              name="phone"
              type="tel"
              placeholder="Tu número de teléfono"
            />

            <div>
              <PasswordInput
                label="Contraseña"
                name="password"
                placeholder="Tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={!dirty || !isValid || isSubmitting}
              className="w-full cursor-pointer rounded-md border border-transparent bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default LoginForm;
