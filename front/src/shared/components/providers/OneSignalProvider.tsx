"use client";

import { useEffect } from "react";
import type { OneSignal } from "@/shared/entities/types/onesignal";
import { useOneSignalStore } from "@/shared/store/useOneSignalStore";

const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

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
  // Obtenemos las acciones del store. Usamos getState() porque esto solo se configura una vez.
  const { setIsSubscribed, setIsLoading } = useOneSignalStore.getState();

  useEffect(() => {
    if (typeof window === "undefined" || !ONE_SIGNAL_APP_ID || window.oneSignalInitialized) {
      if (!window.oneSignalInitialized) setIsLoading(false);
      return;
    }

    window.oneSignalInitialized = true;
    console.log("🟢 Configurando OneSignal por primera vez...");

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONE_SIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
        });

        console.log("✅ OneSignal inicializado correctamente");
        
        // Al iniciar, verificamos el estado actual y actualizamos el store
        const currentSubscription = OneSignal.User.PushSubscription.id;
        const currentPermission = OneSignal.Notifications.permission;
        if (currentSubscription && currentPermission) {
          setIsSubscribed(true);
        }
        setIsLoading(false); // Terminamos la carga inicial

        // Listener para cambios de permiso
        OneSignal.Notifications.addEventListener("permissionChange", (wasGranted: boolean) => {
          console.log(`🔔 El permiso ha cambiado a: ${wasGranted ? 'CONCEDIDO' : 'DENEGADO'}`);
          setIsSubscribed(wasGranted);
          setIsLoading(false); // La interacción terminó, ya no estamos cargando
        });

        // Listener para cambios de suscripción (para sincronizar con el backend)
        OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
          const playerId = event?.current?.id ?? null;
          console.log("🔔 Sincronizando Player ID con el backend:", playerId);
          await fetch("/api/user/save-player-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          });
        });

      } catch (err) {
        console.error("❌ Error al inicializar OneSignal:", err);
        setIsLoading(false);
        window.oneSignalInitialized = false;
      }
    });
  }, [setIsLoading, setIsSubscribed]); 

  return <>{children}</>;
}