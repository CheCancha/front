// src/app/(app)/profile/components/NotificationToggle.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toggle } from "@/shared/components/ui/toggle";
import { Bell, BellOff, ShieldAlert } from "lucide-react";
import type { OneSignal } from "@/shared/entities/types/onesignal";

interface NotificationToggleProps {
  initialState: boolean;
}

export function NotificationToggle({ initialState }: NotificationToggleProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isSdkBlocked, setIsSdkBlocked] = useState(false);

  // Efecto para detectar si el SDK de OneSignal fue bloqueado
  useEffect(() => {
    // Damos un tiempo prudencial (2 segundos) para que el script de OneSignal cargue.
    const timer = setTimeout(() => {
      // Si después de 2 segundos el objeto OneSignal no se ha inicializado en la ventana,
      // asumimos que fue bloqueado por un ad-blocker.
      if (!window.OneSignal) {
        console.warn("OneSignal SDK no se cargó. Probablemente fue bloqueado.");
        setIsSdkBlocked(true);
      }
    }, 2000);

    return () => clearTimeout(timer); // Limpieza del temporizador
  }, []);

  const handleToggleNotifications = async () => {
    if (isSdkBlocked) return; // No hacer nada si el SDK está bloqueado

    setIsPending(true);

    // El SDK debería estar disponible si no fue bloqueado
    window.OneSignalDeferred?.push((OneSignal: OneSignal) => {
      OneSignal.Slidedown.promptPush();
    });

    // Refrescamos después de un tiempo para actualizar el estado desde el servidor.
    // El OneSignalProvider se encargará de la lógica de fondo.
    setTimeout(() => {
      router.refresh();
    }, 2500);
  };

  // --- Renderizado Condicional ---

  if (isSdkBlocked) {
    return (
      <div className="flex items-center space-x-4 rounded-md border border-yellow-200 bg-yellow-50 p-4">
        <ShieldAlert className="h-5 w-5 text-yellow-600" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none text-yellow-800">
            Función no disponible
          </p>
          <p className="text-sm text-yellow-700">
            Tu navegador o un bloqueador de anuncios está impidiendo activar las
            notificaciones.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 rounded-md border p-4">
      {initialState ? (
        <Bell className="h-5 w-5 text-green-500" />
      ) : (
        <BellOff className="h-5 w-5 text-gray-500" />
      )}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">
          Recordatorios de partidos
        </p>
        <p className="text-sm text-muted-foreground">
          {initialState
            ? "Las notificaciones están activas."
            : "Activa los recordatorios 1 hora antes de tu turno."}
        </p>
      </div>
      <Toggle
        aria-label="Toggle notifications"
        pressed={initialState}
        onPressedChange={handleToggleNotifications}
        disabled={isPending || initialState}
      >
        {isPending ? "Procesando..." : initialState ? "Activado" : "Activar"}
      </Toggle>
    </div>
  );
}
