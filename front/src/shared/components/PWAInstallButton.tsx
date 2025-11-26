"use client";

import { useEffect, useState } from "react";

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [canInstall, setCanInstall] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();

      setDeferredPrompt(event);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      console.log("CheCancha instalado!");
    } else {
      console.log("El usuario canceló la instalación");
    }

    setDeferredPrompt(null);
    setCanInstall(false);
  };

  if (!canInstall) return null;

  return (
    <button
      onClick={installApp}
      className="fixed bottom-5 right-5 px-4 py-2 bg-orange-600 text-white rounded-full shadow-lg"
    >
      Instalar CheCancha
    </button>
  );
}
