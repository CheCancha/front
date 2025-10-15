// front/src/shared/components/providers/OneSignalProvider.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import type { OneSignal } from "@/shared/entities/types/onesignal";

const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

// Usaremos una bandera global para asegurarnos de que la inicialización solo ocurra una vez.
declare global {
  interface Window {
    oneSignalInitialized?: boolean;
  }
}

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined" || !ONE_SIGNAL_APP_ID || window.oneSignalInitialized) {
      return;
    }

    // Marcamos como inicializado inmediatamente para prevenir ejecuciones duplicadas
    window.oneSignalInitialized = true;
    console.log("Configurando OneSignal por primera vez...");

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async (OneSignal: OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONE_SIGNAL_APP_ID,
          autoRegister: false,
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
        });

        console.log("✅ OneSignal inicializado correctamente");

        // Registrar el listener de eventos SOLO después de una inicialización exitosa
        OneSignal.on("subscriptionChange", async (isSubscribed: boolean) => {
          // Volvemos a chequear el status aquí por si cambió mientras se inicializaba
          if (status !== "authenticated") return;

          const playerId = isSubscribed ? await OneSignal.getUserId() : null;
          console.log("Cambio de suscripción. Nuevo Player ID:", playerId);

          // Unificamos la llamada a la API
          await fetch("/api/user/save-player-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          });
        });
      } catch (err) {
        console.error("❌ Error al inicializar OneSignal:", err);
        // Si falla la inicialización, reseteamos la bandera para poder reintentar
        window.oneSignalInitialized = false;
      }
    });
  }, [status]); // Mantenemos `status` para que se ejecute cuando el usuario inicie sesión

  return <>{children}</>;
}