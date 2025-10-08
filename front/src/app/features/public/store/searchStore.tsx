import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SportOption } from '@/shared/components/ui/Searchbar';

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

const createSearchSlice: StateCreator<SearchState> = (set) => ({
  // --- Estado Inicial ---
  city: 'Tostado',
  sport: null,
  date: new Date(),
  time: '',

  // --- Acciones para modificar el estado  ---
  setCity: (city) => set({ city }),
  setSport: (sport) => set({ sport }),
  setDate: (date) => set({ date }),
  setTime: (time) => set({ time }),

  // --- Acción para inicializar el estado desde la URL ---
  initializeFromUrl: (params) => {
    const urlCity = params.get('city');
    const urlDate = params.get('date');
    const urlTime = params.get('time');
    
    const newState: Partial<SearchState> = {};
    if (urlCity) newState.city = urlCity;
    if (urlDate) newState.date = new Date(`${urlDate}T00:00:00`);
    if (urlTime) newState.time = urlTime;
    
    set(newState);
  },
});

export const useSearchStore = create<SearchState>()(
  devtools(
    createSearchSlice,
    { name: 'SearchStore' }
  )
);