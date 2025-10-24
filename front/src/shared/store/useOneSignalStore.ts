// front/src/shared/stores/useOneSignalStore.ts
import { create } from 'zustand';

// Define la "forma" de nuestro store: el estado y las acciones
interface OneSignalState {
  isSubscribed: boolean;
  isLoading: boolean;
  setIsSubscribed: (status: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  promptForPush: () => void;
}

// Crea el store
export const useOneSignalStore = create<OneSignalState>((set) => ({
  // --- ESTADO INICIAL ---
  isSubscribed: false,
  isLoading: true, // Empezamos asumiendo que estamos cargando hasta que el SDK nos diga lo contrario

  // --- ACCIONES ---
  setIsSubscribed: (status) => set({ isSubscribed: status }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  promptForPush: async () => { // <--- Asegúrate de que es async
        if (!window.OneSignal) {
            console.error("❌ [PROMPT ERROR] No se puede mostrar el prompt, OneSignal no está disponible.");
            return;
        }
        
        // Al iniciar la acción, ponemos el estado en "cargando"
        set({ isLoading: true });
        
        try {
            // 🛑 ELIMINAMOS: window.OneSignal.Slidedown.promptPush();
            // ✅ USAMOS: La solicitud de permiso nativa (Notifications.requestPermission)
            
            const permissionResult = await window.OneSignal.Notifications.requestPermission();
            
            console.log(`✅ [PROMPT LOG] Resultado de la solicitud nativa: ${permissionResult}`);

        } catch (error) {
            console.error("❌ [PROMPT ERROR] Error al solicitar permiso:", error);
            set({ isLoading: false });
        }
        // Nota: El 'isLoading: false' final lo manejamos principalmente en 
        // el OneSignalProvider.tsx a través del listener de cambio de suscripción.
    },
}));