"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      console.log("CheCancha instalado");
    }

    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-brand-orange text-white px-4 py-3 flex items-center justify-between shadow-md animate-slide-down bottom-0 fixed z-50">
      <span className="font-medium">
        Instalá CheCancha para una mejor experiencia
      </span>

      <div className="flex items-center gap-3">
        <button
          onClick={installApp}
          className="bg-white text-brand-orange font-semibold px-3 py-1 rounded-md shadow hover:bg-brand-dark hover:text-white transition-colors duration-200 cursor-pointer"
        >
          Instalar
        </button>

        <button onClick={() => setVisible(false)}>
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
