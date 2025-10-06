"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { routes } from "@/routes";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/ui/Spinner";

function ResetPasswordComponent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token no encontrado. Asegurate de usar el enlace del email.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center">Establecer Nueva Contraseña</h2>
      {!message ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password">Nueva Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full mt-1 p-2 border rounded-md" />
          </div>
          <div>
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full mt-1 p-2 border rounded-md" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-black text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center">
            {loading ? <Spinner /> : "Guardar Contraseña"}
          </button>
        </form>
      ) : (
        <div className="text-center space-y-4 pt-2">
          <p className="text-green-600">{message}</p>
          <Link href={routes.auth.ingreso} passHref>
            <Button className="w-full">
              Ir a Iniciar Sesión
            </Button>
          </Link>
        </div>
      )}
      {error && <p className="text-center text-red-600">{error}</p>}
    </div>
  );
}


export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <ResetPasswordComponent />
      </div>
    </Suspense>
  )
}