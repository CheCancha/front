"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import type { OneSignal } from "@/shared/entities/types/onesignal";

const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

declare global {
  interface Window {
    oneSignalInitialized?: boolean;
    OneSignalDeferred?: ((OneSignal: OneSignal) => void)[];
  }
}

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !ONE_SIGNAL_APP_ID ||
      window.oneSignalInitialized
    )
      return;

    window.oneSignalInitialized = true;
    console.log("🟢 Configurando OneSignal por primera vez...");

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONE_SIGNAL_APP_ID,
          safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
          notifyButton: { enable: false },
          serviceWorkerParam: { scope: "/onesignal/" },
          serviceWorkerPath: "OneSignalSDKWorker.js",
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
        });

        console.log("✅ OneSignal inicializado correctamente");

        // 1️⃣ Si el usuario ya está autenticado y tiene permiso, guardamos su Player ID
        if (status === "authenticated" && Notification.permission === "granted") {
          const playerId = OneSignal?.User?.PushSubscription?.id ?? null;
          if (playerId) {
            await fetch("/api/user/save-player-id", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ playerId }),
            });
            console.log("💾 Player ID sincronizado al iniciar sesión:", playerId);
          }
        }

        // 2️⃣ Escuchamos cambios de suscripción
        OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
          console.log("Cambio de suscripción detectado:", event);

          if (status !== "authenticated") return;

          const playerId = event?.current?.id ?? null;
          console.log("Nuevo Player ID:", playerId);

          await fetch("/api/user/save-player-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          });
        });

        // 3️⃣ Escuchamos cambios de permiso (aceptar / denegar notificaciones)
        OneSignal.Notifications.addEventListener("permissionChange", (event) => {
          console.log("🔔 Cambio de permiso de notificaciones:", event);
        });
      } catch (err) {
        console.error("❌ Error al inicializar OneSignal:", err);
        window.oneSignalInitialized = false; 
      }
    });
  }, [status]);

  return <>{children}</>;
}
