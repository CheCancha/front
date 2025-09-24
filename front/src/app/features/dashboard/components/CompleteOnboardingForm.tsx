"use client";

import { Complex, Sport } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Trash2, PlusCircle } from "lucide-react";

interface PriceRuleState {
  tempId: string; 
  startTime: number;
  endTime: number;
  price: number;
  depositPercentage: number;
}

interface CourtState {
  tempId: string; 
  name: string;
  sportId: string; 
  slotDurationMinutes: number; 
  priceRules: PriceRuleState[];
}

interface CompleteOnboardingFormProps {
  complex: Complex;
}

const durationOptions = [
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "120 min" },
];

const hoursOptions = Array.from({ length: 25 }, (_, i) => ({ value: i, label: `${String(i).padStart(2, "0")}:00` }));

export function CompleteOnboardingForm({ complex }: CompleteOnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [allSports, setAllSports] = useState<Sport[]>([]);

  const [openHour, setOpenHour] = useState(9);
  const [closeHour, setCloseHour] = useState(23);
  const [courts, setCourts] = useState<CourtState[]>([]);

  useEffect(() => {
    async function fetchSports() {
      try {
        const response = await fetch("/api/sports");
        const sportsData: Sport[] = await response.json();
        setAllSports(sportsData);

        if (sportsData.length > 0 && courts.length === 0) {
          setCourts([{
            tempId: `court_${Date.now()}`,
            name: "",
            sportId: sportsData[0].id,
            slotDurationMinutes: 60,
            priceRules: [{
                tempId: `price_${Date.now()}`,
                startTime: 9,
                endTime: 23,
                price: 0,
                depositPercentage: 30
            }]
          }]);
        }
      } catch (error) {
        toast.error("No se pudieron cargar los deportes.");
      }
    }
    fetchSports();
  }, []);

  const handleCourtChange = (courtIndex: number, field: keyof Omit<CourtState, 'priceRules'>, value: string | number) => {
    const newCourts = [...courts];
    newCourts[courtIndex] = { ...newCourts[courtIndex], [field]: value };
    setCourts(newCourts);
  };
  
  const handlePriceRuleChange = (courtIndex: number, ruleIndex: number, field: keyof PriceRuleState, value: string | number) => {
      const newCourts = [...courts];
      const newRules = [...newCourts[courtIndex].priceRules];
      newRules[ruleIndex] = { ...newRules[ruleIndex], [field]: Number(value) || 0 };
      newCourts[courtIndex].priceRules = newRules;
      setCourts(newCourts);
  };

  const addPriceRule = (courtIndex: number) => {
    const newCourts = [...courts];
    newCourts[courtIndex].priceRules.push({
        tempId: `price_${Date.now()}`,
        startTime: 9,
        endTime: 23,
        price: 0,
        depositPercentage: 30,
    });
    setCourts(newCourts);
  };

  const removePriceRule = (courtIndex: number, ruleIndex: number) => {
    const newCourts = [...courts];
    if (newCourts[courtIndex].priceRules.length <= 1) {
        toast.error("Cada cancha debe tener al menos una regla de precio.");
        return;
    }
    newCourts[courtIndex].priceRules = newCourts[courtIndex].priceRules.filter((_, i) => i !== ruleIndex);
    setCourts(newCourts);
  };

  const addCourt = () => {
    if (allSports.length === 0) return;
    setCourts([...courts, {
      tempId: `court_${Date.now()}`,
      name: "",
      sportId: allSports[0].id,
      slotDurationMinutes: 60,
      priceRules: [{ tempId: `price_${Date.now()}`, startTime: 9, endTime: 23, price: 0, depositPercentage: 30 }]
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
    for (const court of courts) {
        if (!court.name.trim()) {
            toast.error(`La cancha "${court.name || 'sin nombre'}" necesita un nombre.`);
            return;
        }
        for(const rule of court.priceRules) {
            if (rule.price <= 0) {
                toast.error(`El precio en la cancha "${court.name}" no puede ser cero.`);
                return;
            }
            if(rule.startTime >= rule.endTime) {
                toast.error(`En la cancha "${court.name}", la hora de inicio debe ser menor que la de fin.`);
                return;
            }
        }
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
          create: courts.map(court => ({
            name: court.name,
            sportId: court.sportId,
            slotDurationMinutes: court.slotDurationMinutes,
            priceRules: {
                create: court.priceRules.map(rule => ({
                    startTime: rule.startTime,
                    endTime: rule.endTime,
                    price: rule.price,
                    depositPercentage: rule.depositPercentage
                }))
            }
          })),
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
        throw new Error(errorData.error || "No se pudo guardar la configuración.");
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

      {/* --- Sección de Canchas --- */}
      <section className="pt-6 border-t">
        <h3 className="text-xl font-semibold">Tus Canchas</h3>
        <div className="mt-4 space-y-6">
          {courts.map((court, courtIndex) => (
            <div key={court.tempId} className="p-4 border rounded-lg bg-gray-50 space-y-4">
              {/* --- Fila principal de la cancha --- */}
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 sm:col-span-4"><label className="text-xs font-medium">Nombre Cancha</label><input type="text" placeholder="Ej: Cancha 1" value={court.name} onChange={(e) => handleCourtChange(courtIndex, "name", e.target.value)} className="w-full text-sm rounded-md border-gray-300" /></div>
                <div className="col-span-6 sm:col-span-3"><label className="text-xs font-medium">Deporte</label><select value={court.sportId} onChange={(e) => handleCourtChange(courtIndex, "sportId", e.target.value)} className="w-full text-sm rounded-md border-gray-300">{allSports.map(sport => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></div>
                <div className="col-span-6 sm:col-span-4"><label className="text-xs font-medium">Duración Turno</label><select value={court.slotDurationMinutes} onChange={(e) => handleCourtChange(courtIndex, "slotDurationMinutes", e.target.value)} className="w-full text-sm rounded-md border-gray-300">{durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                <div className="col-span-12 sm:col-span-1"><button type="button" onClick={() => removeCourt(courtIndex)} className="w-full h-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-md"><Trash2 className="w-4 h-4" /></button></div>
              </div>

              {/* --- Sub-sección para Reglas de Precios --- */}
              <div className="pl-4 border-l-2 border-gray-200 space-y-3">
                 <h4 className="text-sm font-semibold text-gray-700">Reglas de Precios</h4>
                 {court.priceRules.map((rule, ruleIndex) => (
                    <div key={rule.tempId} className="grid grid-cols-12 gap-x-3 gap-y-2 items-center bg-white p-3 rounded-md border">
                        <div className="col-span-6 sm:col-span-3"><label className="text-xs font-medium">Desde</label><select value={rule.startTime} onChange={(e) => handlePriceRuleChange(courtIndex, ruleIndex, 'startTime', e.target.value)} className="w-full text-xs rounded-md border-gray-300">{hoursOptions.map(opt => <option key={`start-${opt.value}`} value={opt.value}>{opt.label}</option>)}</select></div>
                        <div className="col-span-6 sm:col-span-3"><label className="text-xs font-medium">Hasta</label><select value={rule.endTime} onChange={(e) => handlePriceRuleChange(courtIndex, ruleIndex, 'endTime', e.target.value)} className="w-full text-xs rounded-md border-gray-300">{hoursOptions.map(opt => <option key={`end-${opt.value}`} value={opt.value}>{opt.label}</option>)}</select></div>
                        <div className="col-span-6 sm:col-span-2"><label className="text-xs font-medium">Precio</label><input type="number" placeholder="5000" value={rule.price} onChange={(e) => handlePriceRuleChange(courtIndex, ruleIndex, 'price', e.target.value)} className="w-full text-xs rounded-md border-gray-300" /></div>
                        <div className="col-span-6 sm:col-span-3"><label className="text-xs font-medium">% Seña</label><input type="number" placeholder="30" value={rule.depositPercentage} onChange={(e) => handlePriceRuleChange(courtIndex, ruleIndex, 'depositPercentage', e.target.value)} className="w-full text-xs rounded-md border-gray-300" /></div>
                        <div className="col-span-12 sm:col-span-1"><button type="button" onClick={() => removePriceRule(courtIndex, ruleIndex)} className="w-full h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md text-xs">Quitar</button></div>
                    </div>
                 ))}
                 <button type="button" onClick={() => addPriceRule(courtIndex)} className="w-full mt-2 py-1 text-xs font-semibold border-2 border-dashed rounded-lg flex items-center justify-center gap-1 hover:bg-gray-100">
                    <PlusCircle size={14} /> Añadir franja horaria
                 </button>
              </div>
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