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
  
  promptForPush: () => {
    if (!window.OneSignal) {
      console.error("No se puede mostrar el prompt, OneSignal no está disponible.");
      return;
    }
    
    // Al iniciar la acción, ponemos el estado en "cargando"
    set({ isLoading: true });
    
    // Llamamos al SDK de OneSignal
    window.OneSignal.Slidedown.promptPush();
    // No necesitamos poner isLoading: false aquí, el listener de eventos se encargará.
  },
}));