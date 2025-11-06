import { create } from 'zustand';

interface OneSignalState {
  isSubscribed: boolean;
  isLoading: boolean;
  setIsSubscribed: (status: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  promptForPush: () => void;
}

export const useOneSignalStore = create<OneSignalState>((set) => ({
  isSubscribed: false,
  isLoading: true, 

  setIsSubscribed: (status) => set({ isSubscribed: status }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  promptForPush: async () => { 
        if (!window.OneSignal) {
            console.error("❌ [PROMPT ERROR] No se puede mostrar el prompt, OneSignal no está disponible.");
            return;
        }
        
        set({ isLoading: true });
        
        try {
            
            const permissionResult = await window.OneSignal.Notifications.requestPermission();
            console.log(`✅ [PROMPT LOG] Resultado de la solicitud nativa: ${permissionResult}`);

        } catch (error) {
            console.error("❌ [PROMPT ERROR] Error al solicitar permiso:", error);
            set({ isLoading: false });
        }
    },
}));