"use client";

import { Complex, Sport } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";

// --- Tipos y Datos ---
interface CourtState {
  name: string;
  sportId: string; // Se usa sportId en lugar de un enum
  pricePerHour: number;
  depositAmount: number;
  slotDurationMinutes: number; // Cada cancha tiene su propia duración
}

interface CompleteOnboardingFormProps {
  complex: Complex;
}

// Opciones para la duración del turno
const durationOptions = [
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "120 min" },
];

export function CompleteOnboardingForm({ complex }: CompleteOnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [allSports, setAllSports] = useState<Sport[]>([]);

  // --- Estados del Formulario ---
  const [openHour, setOpenHour] = useState(9); // 09:00
  const [closeHour, setCloseHour] = useState(23); // 23:00
  const [courts, setCourts] = useState<CourtState[]>([]);

  // Cargar deportes desde la API al montar el componente
  useEffect(() => {
    async function fetchSports() {
      try {
        const response = await fetch("/api/sports");
        const sportsData: Sport[] = await response.json();
        setAllSports(sportsData);
        // Inicializar la primera cancha con el primer deporte disponible
        if (sportsData.length > 0) {
          setCourts([{
            name: "",
            sportId: sportsData[0].id,
            pricePerHour: 0,
            depositAmount: 0,
            slotDurationMinutes: 60,
          }]);
        }
      } catch (error) {
        toast.error("No se pudieron cargar los deportes.");
      }
    }
    fetchSports();
  }, []);

  // --- Manejadores ---
  const handleCourtChange = (index: number, field: keyof CourtState, value: string) => {
    const newCourts = [...courts];
    const isNumberField = field === 'pricePerHour' || field === 'depositAmount' || field === 'slotDurationMinutes';
    newCourts[index] = { ...newCourts[index], [field]: isNumberField ? parseInt(value, 10) || 0 : value };
    setCourts(newCourts);
  };

  const addCourt = () => {
    if (allSports.length === 0) return;
    setCourts([...courts, {
      name: "",
      sportId: allSports[0].id,
      pricePerHour: 0,
      depositAmount: 0,
      slotDurationMinutes: 60,
    }]);
  };

  const removeCourt = (index: number) => {
    if (courts.length <= 1) {
      toast.error("Debes tener al menos una cancha.");
      return;
    }
    setCourts(courts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (courts.some((c) => !c.name.trim() || c.pricePerHour <= 0)) {
      toast.error("Completa el nombre y precio de todas las canchas.");
      return;
    }
    setIsLoading(true);
    toast.loading("Finalizando configuración...");

    try {
      const payload = {
        general: {
          openHour: openHour,
          closeHour: closeHour,
        },
        courts: {
          create: courts,
          update: [],
          delete: [],
        },
      };

      const response = await fetch(`/api/complex/${complex.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast.dismiss();
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo guardar la configuración.");
      }
      toast.success("¡Tu complejo está listo!");
      router.push(`/dashboard/${complex.id}/settings`);
      router.refresh();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const hoursOptions = Array.from({ length: 25 }, (_, i) => ({ value: i, label: `${String(i).padStart(2, "0")}:00` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Horarios Generales */}
      <section>
        <h3 className="text-xl font-semibold">Horarios Generales</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Abre a las</label>
            <select value={openHour} onChange={(e) => setOpenHour(Number(e.target.value))} className="w-full rounded-md border-gray-300">
                {hoursOptions.map(opt => <option key={`open-${opt.value}`} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cierra a las</label>
            <select value={closeHour} onChange={(e) => setCloseHour(Number(e.target.value))} className="w-full rounded-md border-gray-300">
                {hoursOptions.map(opt => <option key={`close-${opt.value}`} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Canchas */}
      <section className="pt-6 border-t">
        <h3 className="text-xl font-semibold">Tus Canchas</h3>
        <div className="mt-4 space-y-4">
          {courts.map((court, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-lg items-end">
              <div className="col-span-12 sm:col-span-3"><label className="text-xs font-medium">Nombre</label><input type="text" placeholder="Ej: Cancha Central" value={court.name} onChange={(e) => handleCourtChange(index, "name", e.target.value)} className="w-full text-sm rounded-md border-gray-300" /></div>
              <div className="col-span-6 sm:col-span-2"><label className="text-xs font-medium">Deporte</label><select value={court.sportId} onChange={(e) => handleCourtChange(index, "sportId", e.target.value)} className="w-full text-sm rounded-md border-gray-300">{allSports.map(sport => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></div>
              <div className="col-span-6 sm:col-span-2"><label className="text-xs font-medium">Duración</label><select value={court.slotDurationMinutes} onChange={(e) => handleCourtChange(index, "slotDurationMinutes", e.target.value)} className="w-full text-sm rounded-md border-gray-300">{durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
              <div className="col-span-6 sm:col-span-2"><label className="text-xs font-medium">Precio/hora</label><input type="number" placeholder="10000" value={court.pricePerHour} onChange={(e) => handleCourtChange(index, "pricePerHour", e.target.value)} className="w-full text-sm rounded-md border-gray-300" /></div>
              <div className="col-span-6 sm:col-span-2"><label className="text-xs font-medium">Seña</label><input type="number" placeholder="2000" value={court.depositAmount} onChange={(e) => handleCourtChange(index, "depositAmount", e.target.value)} className="w-full text-sm rounded-md border-gray-300" /></div>
              <div className="col-span-12 sm:col-span-1"><button type="button" onClick={() => removeCourt(index)} className="w-full h-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-md"><Trash2 className="w-4 h-4" /></button></div>
            </div>
          ))}
          <button type="button" onClick={addCourt} className="w-full mt-2 py-2 text-sm font-semibold border-2 border-dashed rounded-lg hover:bg-gray-50">+ Añadir otra cancha</button>
        </div>
      </section>

      {/* Botón de Envío */}
      <div className="flex justify-end pt-6 border-t">
        <button type="submit" disabled={isLoading} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 disabled:bg-gray-400">
          {isLoading ? "Guardando..." : "Completar y Guardar"}
        </button>
      </div>
    </form>
  );
}
