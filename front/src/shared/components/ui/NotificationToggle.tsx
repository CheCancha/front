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

  const handleToggleNotifications = async () => {

  setIsPending(true);

  window.OneSignalDeferred?.push(async (OneSignal: OneSignal) => {
    try {
      await OneSignal.Slidedown.promptPush();

      OneSignal.Notifications.addEventListener(
        "permissionChange",
        async (event) => {
          console.log("Cambio de permiso:", event);

          if (Notification.permission === "granted") {
            console.log("🔔 Permiso concedido. Actualizando servidor...");

            const playerId =
              (await OneSignal.User.PushSubscription.id) ?? null;

            await fetch("/api/user/save-player-id", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ playerId }),
            });

            // Refrescamos la UI para mostrar “Activado”
            router.refresh();
          } else {
            console.warn("🚫 Permiso denegado o cerrado por el usuario");
          }

          setIsPending(false);
        }
      );
    } catch (err) {
      console.error("Error en el flujo de notificaciones:", err);
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