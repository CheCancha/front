import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SportOption } from '@/shared/components/ui/Searchbar'; // Asumimos que exportarás este tipo

interface SearchState {
  city: string;
  sport: SportOption | null;
  date: Date | undefined;
  time: string;
  setCity: (city: string) => void;
  setSport: (sport: SportOption | null) => void;
  setDate: (date: Date | undefined) => void;
  setTime: (time: string) => void;
  initializeFromUrl: (params: URLSearchParams) => void;
}

// --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
// Se utiliza el tipo `StateCreator` de Zustand para darle un tipo explícito
// a la función que crea el estado, lo que a su vez tipa correctamente el parámetro `set`.
const createSearchSlice: StateCreator<SearchState> = (set) => ({
  // --- Estado Inicial ---
  city: 'Tostado',
  sport: null,
  date: new Date(),
  time: '',

  // --- Acciones para modificar el estado (ya estaban bien tipadas por la interfaz) ---
  setCity: (city) => set({ city }),
  setSport: (sport) => set({ sport }),
  setDate: (date) => set({ date }),
  setTime: (time) => set({ time }),

  // --- Acción para inicializar el estado desde la URL ---
  initializeFromUrl: (params) => {
    const urlCity = params.get('city');
    const urlDate = params.get('date');
    const urlTime = params.get('time');
    
    // El objeto que se pasa a 'set' debe coincidir con el estado,
    // por lo que creamos un objeto parcial y lo llenamos.
    const newState: Partial<SearchState> = {};
    if (urlCity) newState.city = urlCity;
    if (urlDate) newState.date = new Date(`${urlDate}T00:00:00`);
    if (urlTime) newState.time = urlTime;
    
    set(newState);
  },
});

export const useSearchStore = create<SearchState>()(
  devtools(
    createSearchSlice, // Usamos nuestra función tipada
    { name: 'SearchStore' }
  )
);