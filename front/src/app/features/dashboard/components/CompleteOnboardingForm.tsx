// front/src/app/features/dashboard/components/CompleteOnboardingForm.tsx

"use client";

import { Complex, Sport } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";

// --- Tipos y Datos Constantes ---

// Tipo para el estado de una cancha individual en el formulario
interface CourtState {
  name: string;
  sport: Sport;
  pricePerHour: number;
  depositAmount: number;
}

// Tipo para las props del componente
interface CompleteOnboardingFormProps {
  complex: Complex;
}

const initialCourtState: CourtState = {
  name: "",
  sport: "PADEL",
  pricePerHour: 0,
  depositAmount: 0,
};

// Genera opciones de tiempo en intervalos de 30 minutos
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    value: totalMinutes, // Guardamos el valor en minutos para mayor precisión
    label: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`,
  };
});

// Opciones para la duración del turno
const durationOptions = [
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
];

export function CompleteOnboardingForm({
  complex,
}: CompleteOnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // --- Estados del Formulario ---
  const [openHour, setOpenHour] = useState(540); // 09:00 en minutos
  const [closeHour, setCloseHour] = useState(1380); // 23:00 en minutos
  const [slotDuration, setSlotDuration] = useState(60);
  const [courts, setCourts] = useState<CourtState[]>([initialCourtState]);

  // --- Manejadores para el formulario de Canchas (Ahora 100% tipado) ---
  const handleCourtChange = (
    index: number,
    field: keyof CourtState,
    value: string // El valor de un input/select siempre es string
  ) => {
    const newCourts = [...courts];
    const courtToUpdate = { ...newCourts[index] };

    // Verificamos el campo para asignar el tipo correcto
    switch (field) {
      case "name":
        courtToUpdate.name = value;
        break;
      case "sport":
        courtToUpdate.sport = value as Sport; // Confiamos que el valor del select es un Sport válido
        break;
      case "pricePerHour":
      case "depositAmount":
        courtToUpdate[field] = parseInt(value, 10) || 0; // Convertimos a número
        break;
    }

    newCourts[index] = courtToUpdate;
    setCourts(newCourts);
  };

  const addCourt = () => {
    setCourts([...courts, initialCourtState]);
  };

  const removeCourt = (index: number) => {
    if (courts.length <= 1) {
      toast.error("Debes tener al menos una cancha.");
      return;
    }
    setCourts(courts.filter((_, i) => i !== index));
  };

  // --- Manejador para guardar todo ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (courts.some((c) => !c.name.trim() || c.pricePerHour <= 0)) {
      toast.error(
        "Por favor, completa el nombre y el precio de todas las canchas."
      );
      return;
    }

    setIsLoading(true);
    toast.loading("Finalizando configuración...");

    try {
      const openHourInHours = Math.floor(openHour / 60);
      const closeHourInHours = Math.floor(closeHour / 60);

      const response = await fetch(`/api/complex/complete-onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complexId: complex.id,
          slotDurationMinutes: slotDuration,
          openHour: openHourInHours,
          closeHour: closeHourInHours,
          courts: courts,
        }),
      });

      toast.dismiss();
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "No se pudo guardar la configuración."
        );
      }

      toast.success("¡Tu complejo está listo!");
      router.push(`/dashboard/${complex.id}`);
      router.refresh();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* --- Horarios y Turnos --- */}
      <section>
        <h3 className="text-xl font-semibold">Horarios y Turnos</h3>
        <p className="text-sm text-gray-500">
          Define los horarios generales y la duración de los turnos.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Abre a las
            </label>
            <select
              value={openHour}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setOpenHour(Number(e.target.value))
              }
              className="w-full rounded-md border-gray-300"
            >
              {timeOptions.map((opt) => (
                <option key={`open-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cierra a las
            </label>
            <select
              value={closeHour}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCloseHour(Number(e.target.value))
              }
              className="w-full rounded-md border-gray-300"
            >
              {timeOptions.map((opt) => (
                <option key={`close-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duración del Turno
            </label>
            <select
              value={slotDuration}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSlotDuration(Number(e.target.value))
              }
              className="w-full rounded-md border-gray-300"
            >
              {durationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* --- Formulario de Canchas --- */}
      <section className="pt-6 border-t">
        <h3 className="text-xl font-semibold">Tus Canchas</h3>
        <p className="text-sm text-gray-500">
          Añade todas las canchas que tengas disponibles en tu complejo.
        </p>
        <div className="mt-4 space-y-4">
          {courts.map((court, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 p-4 border rounded-lg items-end"
            >
              <div className="col-span-12 sm:col-span-4">
                <label className="text-xs font-medium text-gray-600">
                  Nombre Cancha
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cancha Central"
                  value={court.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleCourtChange(index, "name", e.target.value)
                  }
                  className="w-full text-sm rounded-md border-gray-300"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="text-xs font-medium text-gray-600">
                  Deporte
                </label>
                <select
                  value={court.sport}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    handleCourtChange(index, "sport", e.target.value as Sport)
                  }
                  className="w-full text-sm rounded-md border-gray-300"
                >
                  {Object.values(Sport).map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-6 sm:col-span-2">
                <label className="text-xs font-medium text-gray-600">
                  Precio/hora
                </label>
                <input
                  type="number"
                  placeholder="10000"
                  value={court.pricePerHour}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleCourtChange(index, "pricePerHour", e.target.value)
                  }
                  className="w-full text-sm rounded-md border-gray-300"
                />
              </div>
              <div className="col-span-10 sm:col-span-2">
                <label className="text-xs font-medium text-gray-600">
                  Seña
                </label>
                <input
                  type="number"
                  placeholder="2000"
                  value={court.depositAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleCourtChange(index, "depositAmount", e.target.value)
                  }
                  className="w-full text-sm rounded-md border-gray-300"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <button
                  type="button"
                  onClick={() => removeCourt(index)}
                  className="w-full h-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addCourt}
            className="w-full mt-2 py-2 text-sm font-semibold border-2 border-dashed rounded-lg hover:bg-gray-50"
          >
            + Añadir otra cancha
          </button>
        </div>
      </section>

      {/* --- Botón de Envío --- */}
      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 disabled:bg-gray-400"
        >
          {isLoading ? "Guardando..." : "Completar y Guardar"}
        </button>
      </div>
    </form>
  );
}
