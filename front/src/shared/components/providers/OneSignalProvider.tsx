"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import type { OneSignal } from "@/shared/entities/types/onesignal";

const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

if (!ONE_SIGNAL_APP_ID) {
  console.error("❌ OneSignal App ID no está configurado en las variables de entorno.");
}

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined" || !ONE_SIGNAL_APP_ID) return;

    // Asegurar que el array exista
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // Registrar la inicialización de OneSignal
    window.OneSignalDeferred.push(async (OneSignal: OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONE_SIGNAL_APP_ID,
          safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_ID,
          autoRegister: false,
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
        });

        console.log("✅ OneSignal inicializado correctamente");
      } catch (err) {
        console.error("❌ Error al inicializar OneSignal:", err);
      }

      OneSignal.on("subscriptionChange", async (isSubscribed: boolean) => {
        if (status !== "authenticated") return;

        if (isSubscribed) {
          const playerId = await OneSignal.getUserId(); // ✅ v16 compatible
          console.log("Usuario suscrito. Player ID:", playerId);

          if (playerId) {
            await fetch("/api/user/save-player-id", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ playerId }),
            });
          }
        } else {
          console.log("El usuario ha cancelado la suscripción.");
          await fetch("/api/user/save-player-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: null }),
          });
        }
      });
    });
  }, [status]);

  return <>{children}</>;
}
