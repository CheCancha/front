// src/shared/components/providers/OneSignalProvider.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import type { OneSignal } from "@/shared/entities/types/onesignal";

const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

if (!ONE_SIGNAL_APP_ID) {
  console.error(
    "OneSignal App ID no está configurado en las variables de entorno."
  );
}

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined" || !ONE_SIGNAL_APP_ID) {
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async (OneSignal: OneSignal) => {
      if (OneSignal.isInitialized()) return;

      await OneSignal.init({
        appId: ONE_SIGNAL_APP_ID,
        autoRegister: false,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
      });

      OneSignal.on("subscriptionChange", async (isSubscribed: boolean) => {
        if (status !== "authenticated") return;

        if (isSubscribed) {
          const playerId = await OneSignal.getUserId();
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
