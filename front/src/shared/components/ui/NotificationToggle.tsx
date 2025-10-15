"use client";

import { Toggle } from "@/shared/components/ui/toggle";
import { Bell, BellOff } from "lucide-react";
import { useOneSignalStore } from "@/shared/store/useOneSignalStore";

interface NotificationToggleProps {
  initialState: boolean;
}

export function NotificationToggle({ initialState }: NotificationToggleProps) {
  const { isSubscribed, isLoading, promptForPush } = useOneSignalStore();

  return (
    <div className="flex items-center space-x-4 rounded-md border p-4">
      {isSubscribed ? (
        <Bell className="h-5 w-5 text-green-500" />
      ) : (
        <BellOff className="h-5 w-5 text-gray-500" />
      )}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">
          Recordatorios de partidos
        </p>
        <p className="text-sm text-muted-foreground">
          {isSubscribed
            ? "Las notificaciones están activas."
            : "Activa los recordatorios 1 hora antes de tu turno."}
        </p>
      </div>
      <Toggle
        aria-label="Toggle notifications"
        pressed={isSubscribed}
        onPressedChange={promptForPush} // Al hacer clic, simplemente llama a la acción del store
        disabled={isLoading || isSubscribed}
      >
        {isLoading ? "Procesando..." : isSubscribed ? "Activado" : "Activar"}
      </Toggle>
    </div>
  );
}