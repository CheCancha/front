"use client";

import { useEffect } from "react";
import { useOneSignalStore } from "@/shared/store/useOneSignalStore";
import type {
  OneSignal,
  PushSubscriptionChangeEvent,
} from "@/shared/entities/types/onesignal";

// --- Configuración  ---
const ONESIGNAL_APP_ID = "b5b527c8-9b39-4e83-a2b1-36220bc27f53"; // ⚠️ REEMPLAZA con tu ID real de OneSignal ⚠️
// -----------------------------------------------------

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { setIsSubscribed, setIsLoading } = useOneSignalStore();

  useEffect(() => {
    if (typeof window === "undefined" || window.oneSignalInitialized) return;

    window.oneSignalInitialized = true;
    console.log("🟢 [INIT] Esperando a que OneSignal esté disponible...");

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // ✅ Ahora usamos el tipo OneSignal importado
    window.OneSignalDeferred.push(async (OneSignal: OneSignal) => {
      console.log("✅ [INIT] OneSignal listo para inicializar.");

      // 1. LLAMADA DE INICIALIZACIÓN FALTANTE
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });
        console.log(
          "🚀 [INIT] OneSignal inicializado y configurado con App ID."
        );
      } catch (error) {
        console.error(
          "❌ [INIT ERROR] Falló la inicialización de OneSignal:",
          error
        );
        setIsLoading(false);
        return;
      }

      // 2. LOG Y ESTADO INICIAL
      const permission = await OneSignal.Notifications.permission;
      // ✅ Usar operador de encadenamiento opcional
      
      const { id, optedIn } = OneSignal.User.PushSubscription;
      const isCurrentlySubscribed =
        typeof optedIn === "boolean" ? optedIn : id !== null && id !== undefined;

      console.log("🔔 [STATE] Permiso actual:", permission);
      console.log("💻 [STATE] ¿Suscrito actualmente?:", isCurrentlySubscribed);

      setIsSubscribed(isCurrentlySubscribed);
      setIsLoading(false);

      // 3. ESCUCHAR CAMBIOS (Con tipado correcto)
      OneSignal.User.PushSubscription.addEventListener(
        "change",
        async (event: PushSubscriptionChangeEvent) => {
          const playerId = event.current?.id ?? null;
          const isNowSubscribed =
            typeof event.current?.optedIn === "boolean"
              ? event.current.optedIn
              : playerId !== null;

          console.log("📢 [EVENT] Player ID actualizado:", playerId);
          setIsSubscribed(isNowSubscribed);

          await fetch("/api/user/save-player-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          });
        }
      );
    });
  }, [setIsSubscribed, setIsLoading]);

  return <>{children}</>;
}
