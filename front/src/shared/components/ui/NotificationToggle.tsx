// src/shared/components/ui/NotificationToggle.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toggle } from "@/shared/components/ui/toggle";
import { Bell, BellOff } from "lucide-react";
import type { OneSignal } from "@/shared/entities/types/onesignal";

interface NotificationToggleProps {
  initialState: boolean;
}

export function NotificationToggle({ initialState }: NotificationToggleProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleToggleNotifications = () => {
    // 1. Log inicial al presionar el botón
    console.log("🔔 Toggle de notificaciones presionado.");

    if (initialState || isPending) {
      console.log("🛑 Acción detenida: ya está activo o en proceso.");
      return;
    }

    console.log("🔄 Cambiando a estado 'Procesando...'");
    setIsPending(true); // Poner en estado de carga

    window.OneSignalDeferred?.push(async (OneSignal: OneSignal) => {
      console.log("➡️ Accediendo al SDK de OneSignal para mostrar el prompt.");
      try {
        // 2. Log justo antes de mostrar el pop-up
        console.log("⏳ Mostrando el prompt. Esperando interacción del usuario...");
        
        await OneSignal.Slidedown.promptPush();

        // 3. Log cuando el usuario interactúa (acepta, rechaza o cierra)
        console.log("✅ Interacción del usuario completada.");

        // 4. Log antes de refrescar los datos
        console.log("🔄 Refrescando datos del servidor con router.refresh()...");
        router.refresh();
        
      } catch (error) {
        // 5. Log detallado si algo falla en el proceso
        console.error("🚨 Error al mostrar o procesar el prompt de OneSignal:", error);
        
        console.log("🔄 Volviendo al estado inicial debido a un error.");
        setIsPending(false);
      }
    });
  };

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