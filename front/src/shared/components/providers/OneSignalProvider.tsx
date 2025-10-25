"use client";

import { useEffect } from "react";
import { useOneSignalStore } from "@/shared/store/useOneSignalStore";
import type {
  OneSignal,
  PushSubscriptionChangeEvent,
  NotificationDisplayEvent,
} from "@/shared/entities/types/onesignal";

// --- Configuración ---
const ONESIGNAL_APP_ID = "b5b527c8-9b39-4e83-a2b1-36220bc27f53";

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { setIsSubscribed, setIsLoading } = useOneSignalStore();

  useEffect(() => {
    if (typeof window === "undefined" || window.oneSignalInitialized) return;

    window.oneSignalInitialized = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async (OneSignal: OneSignal) => {

      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });
      } catch (error) {
        console.error("❌ [INIT ERROR]", error);
        setIsLoading(false);
        return;
      }

      // --- ESTADO INICIAL ---
      const { id, optedIn } = OneSignal.User.PushSubscription;
      const isSubscribed =
        typeof optedIn === "boolean"
          ? optedIn
          : id !== null && id !== undefined;


      setIsSubscribed(isSubscribed);
      setIsLoading(false);

      // --- CAMBIO DE SUSCRIPCIÓN ---
      OneSignal.User.PushSubscription.addEventListener(
        "change",
        async (event: PushSubscriptionChangeEvent) => {
          const playerId = event.current?.id ?? null;
          const isNowSubscribed = playerId !== null;

          setIsSubscribed(isNowSubscribed);

          await fetch("/api/user/save-player-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          });
        }
      );

      // --- NOTIFICACIÓN MOSTRADA (v16 usa 'foregroundWillDisplay') ---
      OneSignal.Notifications.addEventListener(
        "notificationDisplay",
        async (event: NotificationDisplayEvent) => {
          const notification = event.notification;

          try {
            await fetch("/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: notification.title,
                message: notification.body,
                icon: notification.icon,
                url: notification.data?.url ?? null,
              }),
            });

            window.dispatchEvent(new Event("new-notification"));

          } catch (err) {
            console.error(
              "❌ [NOTIFICATION] Error al guardar la notificación:",
              err
            );
          }
        }
      );
    });
  }, [setIsSubscribed, setIsLoading]);

  return <>{children}</>;
}
