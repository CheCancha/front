"use client";

import { useEffect } from "react";

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

useEffect(() => {
  if (typeof window === "undefined" || window.oneSignalInitialized) return;

  window.oneSignalInitialized = true;
  console.log("🟢 Esperando a que OneSignal esté disponible...");

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    console.log("✅ OneSignal listo y auto-inicializado");

    // Consultar permiso actual
    const permission = await OneSignal.Notifications.permission;
    console.log("🔔 Permiso actual:", permission);

    // Escuchar cambios
    OneSignal.User.PushSubscription.addEventListener("change", async (event: any) => {
      const playerId = event?.current?.id ?? null;
      console.log("🔔 Player ID actualizado:", playerId);

      await fetch("/api/user/save-player-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    });
  });
}, []);



  return <>{children}</>;
}
