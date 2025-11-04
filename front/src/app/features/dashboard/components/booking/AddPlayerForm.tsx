import { useEffect, useState } from "react";
import { BookingPlayerWithUser, UserSnippet } from "@/shared/entities/booking/bookingTypes";
import { useDebounce } from "@/shared/hooks/useDebounce";
import toast from "react-hot-toast";
import { Input } from "@/shared/components/ui/inputshadcn";
import { Button } from "@/shared/components/ui/button";
import { Loader2 } from "lucide-react";



export const AddPlayerForm = ({
  bookingId,
  onPlayerAdded,
}: {
  bookingId: string;
  onPlayerAdded: (newPlayer: BookingPlayerWithUser) => void;
}) => {
  const [userSearch, setUserSearch] = useState("");
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSnippet[]>([]);

  const debouncedSearchTerm = useDebounce(userSearch, 300);

  useEffect(() => {
    // Usamos el término debounceado para el fetch
    if (debouncedSearchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsLoadingSearch(true);
    const fetchUsers = async () => {
      try {
        // Usamos el término de búsqueda correcto
        const res = await fetch(`/api/users?search=${debouncedSearchTerm}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsLoadingSearch(false);
      }
    };
    fetchUsers();
  }, [debouncedSearchTerm]);

  // Handler para la API que creamos
  const callAddPlayerAPI = async (payload: {
    userId?: string;
    guestName?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al añadir jugador");
      }

      const newPlayer: BookingPlayerWithUser = await response.json();
      toast.success(
        `Jugador ${newPlayer.user?.name || newPlayer.guestName} añadido`
      );
      onPlayerAdded(newPlayer); // Avisamos al padre
      setUserSearch(""); // Limpiamos el input
      setSearchResults([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo añadir");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Click en un usuario del resultado
  const handleSelectUser = (user: UserSnippet) => {
    callAddPlayerAPI({ userId: user.id });
  };

  // Click en "Añadir como invitado"
  const handleAddGuest = () => {
    if (userSearch.trim().length < 3) {
      toast.error("El nombre del invitado debe ser más largo");
      return;
    }
    callAddPlayerAPI({ guestName: userSearch.trim() });
  };

  return (
    <div className="relative mt-4">
      <Input
        type="search"
        placeholder="Buscar cliente o escribir nombre de invitado..."
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
        disabled={isSubmitting}
      />
      {/* Resultados de Búsqueda */}
      {(isLoadingSearch || searchResults.length > 0) && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
          {isLoadingSearch && (
            <div className="p-2 text-sm text-gray-500">Buscando...</div>
          )}
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectUser(user)}
            >
              <p className="font-medium">{user.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Botón para Invitado (si no hay resultados) */}
      {!isLoadingSearch &&
        searchResults.length === 0 &&
        userSearch.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={handleAddGuest}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Añadir "${userSearch}" como invitado`
            )}
          </Button>
        )}
    </div>
  );
};