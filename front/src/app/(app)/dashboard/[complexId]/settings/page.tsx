"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import MPButton from "@/app/features/dashboard/components/MPButton";
import {
  Complex,
  Schedule,
  Court as PrismaCourt,
  Image,
  Sport,
} from "@prisma/client";
import { useParams } from "next/navigation";
import { Trash2, Plus, X } from "lucide-react";
import { Spinner } from "@/shared/components/ui/Spinner";
import ImageSettings from "./ImageSettings";
import { id } from "zod/v4/locales";

// Tipos para los datos completos del complejo
type CourtWithSport = PrismaCourt & { sport: Sport };
// El tipo principal ahora usa CourtWithSport
export type FullComplexData = Complex & {
  schedule: Schedule | null;
  courts: CourtWithSport[];
  images: Image[];
};

// El tipo para una nueva cancha ahora usa sportId y tiene su duración
type NewCourt = {
  tempId: string;
  name: string;
  sportId: string;
  pricePerHour: number;
  depositAmount: number;
  slotDurationMinutes: number;
  isNew: true;
};

type ScheduleDayKey = Exclude<keyof Schedule, "id" | "complexId">;

// --- Opciones y Mapeos ---
const hoursOptions = Array.from({ length: 25 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, "0")}:00`,
}));
const durationOptions = [
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "120 min" },
];

const dayMapping: {
  [key: string]: { open: ScheduleDayKey; close: ScheduleDayKey };
} = {
  Lunes: { open: "mondayOpen", close: "mondayClose" },
  Martes: { open: "tuesdayOpen", close: "tuesdayClose" },
  Miércoles: { open: "wednesdayOpen", close: "wednesdayClose" },
  Jueves: { open: "thursdayOpen", close: "thursdayClose" },
  Viernes: { open: "fridayOpen", close: "fridayClose" },
  Sábado: { open: "saturdayOpen", close: "saturdayClose" },
  Domingo: { open: "sundayOpen", close: "sundayClose" },
};

// --- Componente Principal ---
export default function SettingsPage() {
  const params = useParams();
  const complexId = params.complexId as string;
  const [data, setData] = useState<FullComplexData | null>(null);
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [newCourts, setNewCourts] = useState<NewCourt[]>([]);
  const [courtsToDelete, setCourtsToDelete] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const fetchComplexData = useCallback(async () => {
    if (typeof complexId !== "string" || !complexId) {
      toast.error("ID de complejo inválido.");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [complexRes, sportsRes] = await Promise.all([
        fetch(`/api/complex/${complexId}/settings`),
        fetch(`/api/sports`),
      ]);

      if (!complexRes.ok)
        throw new Error("No se pudo cargar la configuración del complejo.");
      if (!sportsRes.ok)
        throw new Error("No se pudo cargar la lista de deportes.");

      const complexData = await complexRes.json();
      const sportsData = await sportsRes.json();

      setData(complexData);
      setAllSports(sportsData);
      setNewCourts([]);
      setCourtsToDelete([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [complexId]);

  useEffect(() => {
    fetchComplexData();
  }, [fetchComplexData]);

  // --- Manejadores de cambios (actualizados) ---
  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData((prev) =>
      prev ? { ...prev, [e.target.name]: e.target.value } : null
    );
  };

  const handleScheduleChange = (
    dayKey: ScheduleDayKey,
    value: string | null
  ) => {
    setData((prev) => {
      if (!prev) return null;
      const newSchedule = {
        ...(prev.schedule || { complexId: complexId }),
        [dayKey]: value ? parseInt(value) : null,
      };
      return { ...prev, schedule: newSchedule as Schedule };
    });
  };

  const handleCourtChange = (
    courtId: string,
    field: keyof CourtWithSport,
    value: string | number
  ) => {
    setData((prev) => {
      if (!prev) return null;
      const newCourts = prev.courts.map((court) =>
        court.id === courtId ? { ...court, [field]: value } : court
      );
      return { ...prev, courts: newCourts };
    });
  };

  const handleNewCourtChange = (
    tempId: string,
    field: keyof NewCourt,
    value: string | number
  ) => {
    setNewCourts((prev) =>
      prev.map((court) =>
        court.tempId === tempId ? { ...court, [field]: value } : court
      )
    );
  };

  // --- Manejo de canchas (actualizado) ---
  const addNewCourt = () => {
    if (allSports.length === 0) {
      toast.error("No hay deportes disponibles para crear una cancha.");
      return;
    }
    const newCourt: NewCourt = {
      tempId: `new_${Date.now()}`,
      name: "",
      sportId: allSports[0].id,
      pricePerHour: 0,
      depositAmount: 0,
      slotDurationMinutes: 60,
      isNew: true,
    };
    setNewCourts((prev) => [...prev, newCourt]);
  };

  const removeNewCourt = (tempId: string) => {
    setNewCourts((prev) => prev.filter((court) => court.tempId !== tempId));
  };

  const deleteCourt = (courtId: string) => {
    setCourtsToDelete((prev) => [...prev, courtId]);
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        courts: prev.courts.filter((court) => court.id !== courtId),
      };
    });
  };

  const restoreCourt = (courtId: string) => {
    setCourtsToDelete((prev) => prev.filter((id) => id !== courtId));
    fetchComplexData();
  };

  // --- Guardar cambios ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setIsSaving(true);
    toast.loading("Guardando cambios...");

    try {
      const payload = {
        basicInfo: {
          name: data.name,
          address: data.address,
          city: data.city,
          province: data.province,
        },
        schedule: data.schedule,
        courts: {
          update: data.courts.map((c) => ({
            id: c.id,
            name: c.name,
            sportId: c.sportId,
            pricePerHour: c.pricePerHour,
            depositAmount: c.depositAmount,
            slotDurationMinutes: c.slotDurationMinutes,
          })),
          create: newCourts.map((c) => ({
            name: c.name,
            sportId: c.sportId,
            pricePerHour: c.pricePerHour,
            depositAmount: c.depositAmount,
            slotDurationMinutes: c.slotDurationMinutes,
          })),
          delete: courtsToDelete,
        },
        images: data.images.map((img) => ({
          id: img.id,
          isPrimary: img.isPrimary,
        })),
      };

      const response = await fetch(`/api/complex/${complexId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast.dismiss();
      if (!response.ok) throw new Error("Error al guardar los cambios.");

      toast.success("¡Ajustes guardados con éxito!");
      fetchComplexData();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-8">
        <Spinner />
      </div>
    );
  if (!data) return <div>No se encontró la configuración del complejo.</div>;

  const tabs = [
    { id: "general", label: "Información General" },
    { id: "schedule", label: "Horarios" },
    { id: "courts", label: "Canchas" },
    { id: "images", label: "Imágenes" },
    { id: "payments", label: "Pagos" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Configuración del Club
        </h1>
        <p className="text-gray-600 mt-1">
          Gestiona toda la información de tu complejo desde un solo lugar.
        </p>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg border shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* --- Información General --- */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Información Básica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre del Complejo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={data.name}
                    onChange={handleBasicInfoChange}
                    required
                    className="mt-1 w-full rounded-md p-1 border-1 border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={data.address}
                    onChange={handleBasicInfoChange}
                    required
                    className="mt-1 w-full rounded-md p-1 border-1 border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={data.city}
                    onChange={handleBasicInfoChange}
                    required
                    className="mt-1 w-full rounded-md p-1 border-1 border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={data.province}
                    onChange={handleBasicInfoChange}
                    required
                    className="mt-1 w-full rounded-md p-1 border-1 border-neutral-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- Horarios --- */}
          {activeTab === "schedule" && (
            <div className="space-y-8">
              {/* Horarios por día */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Horarios de Apertura por Día
                      </h3>
                      <p className="text-indigo-100 text-sm">
                        Define las horas de apertura y cierre para cada día. Si
                        un día no se completa, se considerará cerrado.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <div className="space-y-4">
                    {Object.entries(dayMapping).map(
                      ([dayName, { open: openKey, close: closeKey }]) => {
                        const openValue = data.schedule?.[openKey] ?? "";
                        const closeValue = data.schedule?.[closeKey] ?? "";
                        const isOpen =
                          typeof openValue === "number" &&
                          typeof closeValue === "number";

                        return (
                          <div
                            key={dayName}
                            className={`rounded-lg border-2 p-4 transition-all duration-200 ${
                              isOpen
                                ? "border-green-200 bg-green-50"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                            }`}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                              {/* Nombre del día */}
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    isOpen ? "bg-green-500" : "bg-gray-300"
                                  }`}
                                ></div>
                                <span className="font-medium text-gray-900">
                                  {dayName}
                                </span>
                              </div>

                              {/* Select de apertura */}
                              <select
                                value={openValue}
                                onChange={(e) =>
                                  handleScheduleChange(openKey, e.target.value)
                                }
                                className="w-full p-2 rounded-md border border-neutral-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                              >
                                <option value="">Apertura</option>
                                {hoursOptions.map((h) => (
                                  <option
                                    key={`${dayName}-open-${h.value}`}
                                    value={h.value}
                                  >
                                    {h.label}
                                  </option>
                                ))}
                              </select>

                              {/* Select de cierre */}
                              <select
                                value={closeValue}
                                onChange={(e) =>
                                  handleScheduleChange(closeKey, e.target.value)
                                }
                                className="w-full p-2 rounded-md border border-neutral-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                              >
                                <option value="">Cierre</option>
                                {hoursOptions.map((h) => (
                                  <option
                                    key={`${dayName}-close-${h.value}`}
                                    value={h.value}
                                  >
                                    {h.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- Canchas --- */}
          {activeTab === "courts" && (
            <div className="space-y-8">
              {/* Header con botón agregar */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 text-white">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        Gestión de Canchas
                      </h3>
                      <p className="text-emerald-100 text-sm">
                        Configura y administra las canchas de tu complejo.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addNewCourt}
                    className="inline-flex items-center px-4 py-2 bg-white text-emerald-600 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Cancha
                  </button>
                </div>
              </div>

              {/* Canchas existentes */}
              <div className="space-y-4">
                {data.courts.map((court) => (
                  <div
                    key={court.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-600">
                        Cancha Existente
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={court.name}
                          onChange={(e) =>
                            handleCourtChange(court.id, "name", e.target.value)
                          }
                          className="w-full rounded-lg p-2 border border-neutral-300"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Deporte
                        </label>
                        <select
                          value={court.sportId}
                          onChange={(e) =>
                            handleCourtChange(
                              court.id,
                              "sportId",
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg p-2 border border-neutral-300"
                        >
                          {allSports.map((sport) => (
                            <option key={sport.id} value={sport.id}>
                              {sport.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duración Turno
                        </label>
                        <select
                          value={court.slotDurationMinutes}
                          onChange={(e) =>
                            handleCourtChange(
                              court.id,
                              "slotDurationMinutes",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-lg p-2 border border-neutral-300"
                        >
                          {durationOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio / hora
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="number"
                            value={court.pricePerHour}
                            onChange={(e) =>
                              handleCourtChange(
                                court.id,
                                "pricePerHour",
                                Number(e.target.value)
                              )
                            }
                            className="w-full pl-8 rounded-lg p-2 border border-neutral-300"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto Seña
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="number"
                            value={court.depositAmount}
                            onChange={(e) =>
                              handleCourtChange(
                                court.id,
                                "depositAmount",
                                Number(e.target.value)
                              )
                            }
                            className="w-full pl-8 rounded-lg p-2 border border-neutral-300"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => deleteCourt(court.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar cancha"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Nuevas canchas */}
                {newCourts.map((court) => (
                  <div
                    key={court.tempId}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-dashed border-green-300 rounded-xl p-6 shadow-sm"
                  >
                    {/* ... Header de Nueva Cancha ... */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={court.name}
                          onChange={(e) =>
                            handleNewCourtChange(
                              court.tempId,
                              "name",
                              e.target.value
                            )
                          }
                          required
                          className="w-full rounded-lg p-2 border border-neutral-300"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Deporte <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={court.sportId}
                          onChange={(e) =>
                            handleNewCourtChange(
                              court.tempId,
                              "sportId",
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg p-2 border border-neutral-300"
                        >
                          {allSports.map((sport) => (
                            <option key={sport.id} value={sport.id}>
                              {sport.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duración Turno
                        </label>
                        <select
                          value={court.slotDurationMinutes}
                          onChange={(e) =>
                            handleNewCourtChange(
                              court.tempId,
                              "slotDurationMinutes",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-lg p-2 border border-neutral-300"
                        >
                          {durationOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio / hora <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="number"
                            value={court.pricePerHour}
                            onChange={(e) =>
                              handleNewCourtChange(
                                court.tempId,
                                "pricePerHour",
                                Number(e.target.value)
                              )
                            }
                            required
                            className="w-full pl-8 rounded-lg p-2 border border-neutral-300"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto Seña
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="number"
                            value={court.depositAmount}
                            onChange={(e) =>
                              handleNewCourtChange(
                                court.tempId,
                                "depositAmount",
                                Number(e.target.value)
                              )
                            }
                            className="w-full pl-8 rounded-lg p-2 border border-neutral-300"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeNewCourt(court.tempId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Cancelar nueva cancha"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Canchas marcadas para eliminar */}
              {courtsToDelete.length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5C3.546 16.333 4.508 18 6.048 18z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-red-800 mb-2">
                        Canchas marcadas para eliminar
                      </h4>
                      <p className="text-sm text-red-700 mb-4">
                        Estas canchas serán eliminadas cuando guardes los
                        cambios
                      </p>
                      <div className="space-y-3">
                        {courtsToDelete.map((courtId) => (
                          <div
                            key={courtId}
                            className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-900">
                                Cancha ID: {courtId}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => restoreCourt(courtId)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
                            >
                              Restaurar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Imágenes --- */}
          {activeTab === "images" && (
            <ImageSettings
              data={data}
              setData={setData}
              complexId={complexId}
            />
          )}

          {/* --- Pagos --- */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <MPButton complex={data} />

              {data.mp_connected_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-green-400"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Mercado Pago conectado exitosamente
                      </p>
                      <p className="text-sm text-green-700">
                        Conectado el{" "}
                        {new Date(data.mp_connected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* --- Acciones --- */}
          <div className="flex justify-between pt-8 border-t">
            <button
              type="button"
              onClick={() => fetchComplexData()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar Cambios
            </button>
            <div className="flex space-x-3">
              {!data.onboardingCompleted && (
                <div className="text-sm text-gray-500 flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                  Complejo en configuración
                </div>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 disabled:bg-gray-400 cursor-pointer"
              >
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
