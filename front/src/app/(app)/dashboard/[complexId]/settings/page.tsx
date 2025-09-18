"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import MPButton from "@/app/features/dashboard/components/MPButton";
import { Complex, Schedule, Court, Image, Sport } from "@prisma/client";
import { useParams } from "next/navigation";
import { Trash2, Plus, Upload, X } from "lucide-react";
import { Spinner } from "@/shared/components/ui/Spinner";
import ImageSettings from "./ImageSettings";

// Tipos para los datos completos del complejo
export type FullComplexData = Complex & {
  schedule: Schedule | null;
  courts: Court[];
  images: Image[];
};

// Tipo para nueva cancha
type NewCourt = {
  tempId: string;
  name: string;
  sport: Sport;
  pricePerHour: number;
  depositAmount: number;
  isNew: true;
};

// --- Componentes Helper ---
const hoursOptions = Array.from({ length: 25 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, "0")}:00`,
}));

const durationOptions = [
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "120 min" },
];

const sportsOptions = [
  { value: "FUTBOL", label: "Fútbol" },
  { value: "PADEL", label: "Pádel" },
  { value: "TENIS", label: "Tenis" },
  { value: "BASQUET", label: "Básquet" },
  { value: "VOLEY", label: "Vóley" },
];

const dayMapping: { [key: string]: keyof Omit<Schedule, "id" | "complexId"> } =
  {
    Lunes: "mondayOpen",
    Martes: "tuesdayOpen",
    Miércoles: "wednesdayOpen",
    Jueves: "thursdayOpen",
    Viernes: "fridayOpen",
    Sábado: "saturdayOpen",
    Domingo: "sundayOpen",
  };

// --- Componente Principal de la Página ---
export default function SettingsPage() {
  const { complexId } = useParams<{ complexId: string }>();
  const [data, setData] = useState<FullComplexData | null>(null);
  const [newCourts, setNewCourts] = useState<NewCourt[]>([]);
  const [courtsToDelete, setCourtsToDelete] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // --- Cargar datos del complejo ---
  const fetchComplexData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/complex/${complexId}/settings`);
      if (!response.ok) throw new Error("No se pudo cargar la configuración.");
      const complexData = await response.json();
      setData(complexData);
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

  // --- Manejadores de cambios ---
  const handleBasicInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleGeneralChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setData((prev) =>
      prev ? { ...prev, [name]: value ? parseInt(value) : null } : null
    );
  };

  const handleScheduleChange = (
    dayKey: keyof Omit<Schedule, "id" | "complexId">,
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
    field: "name" | "sport" | "pricePerHour" | "depositAmount",
    value: string
  ) => {
    setData((prev) => {
      if (!prev) return null;
      const newCourts = prev.courts.map((court) => {
        if (court.id === courtId) {
          if (field === "name" || field === "sport") {
            return { ...court, [field]: value };
          } else {
            return { ...court, [field]: value ? parseInt(value) : 0 };
          }
        }
        return court;
      });
      return { ...prev, courts: newCourts };
    });
  };

  const handleNewCourtChange = (
    tempId: string,
    field: "name" | "sport" | "pricePerHour" | "depositAmount",
    value: string
  ) => {
    setNewCourts((prev) =>
      prev.map((court) => {
        if (court.tempId === tempId) {
          if (field === "name" || field === "sport") {
            return { ...court, [field]: value };
          } else {
            return { ...court, [field]: value ? parseInt(value) : 0 };
          }
        }
        return court;
      })
    );
  };

  // --- Manejo de canchas ---
  const addNewCourt = () => {
    const newCourt: NewCourt = {
      tempId: `new_${Date.now()}`,
      name: "",
      sport: "FUTBOL" as Sport,
      pricePerHour: 0,
      depositAmount: 0,
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
    // Recargar datos para restaurar la cancha
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
        general: {
          openHour: data.openHour,
          closeHour: data.closeHour,
          slotDurationMinutes: data.slotDurationMinutes,
        },
        schedule: data.schedule
          ? {
              mondayOpen: data.schedule.mondayOpen,
              mondayClose: data.schedule.mondayClose,
              tuesdayOpen: data.schedule.tuesdayOpen,
              tuesdayClose: data.schedule.tuesdayClose,
              wednesdayOpen: data.schedule.wednesdayOpen,
              wednesdayClose: data.schedule.wednesdayClose,
              thursdayOpen: data.schedule.thursdayOpen,
              thursdayClose: data.schedule.thursdayClose,
              fridayOpen: data.schedule.fridayOpen,
              fridayClose: data.schedule.fridayClose,
              saturdayOpen: data.schedule.saturdayOpen,
              saturdayClose: data.schedule.saturdayClose,
              sundayOpen: data.schedule.sundayOpen,
              sundayClose: data.schedule.sundayClose,
            }
          : {},
        courts: {
          update: data.courts.map((c) => ({
            id: c.id,
            name: c.name,
            sport: c.sport,
            pricePerHour: c.pricePerHour,
            depositAmount: c.depositAmount,
          })),
          create: newCourts.map((c) => ({
            name: c.name,
            sport: c.sport,
            pricePerHour: c.pricePerHour,
            depositAmount: c.depositAmount,
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

      // Marcar onboarding como completado si no estaba
      if (!data.onboardingCompleted) {
        await fetch(`/api/complex/${complexId}/complete-onboarding`, {
          method: "POST",
        });
      }

      toast.success("¡Ajustes guardados con éxito!");
      fetchComplexData(); // Recargar datos
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div>
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
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
                    className="mt-1 w-full rounded-md border-gray-300"
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
                    className="mt-1 w-full rounded-md border-gray-300"
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
                    className="mt-1 w-full rounded-md border-gray-300"
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
                    className="mt-1 w-full rounded-md border-gray-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- Horarios --- */}
          {activeTab === "schedule" && (
            <>
              {/* Configuración General */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  Configuración General de Horarios
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hora de Apertura General
                    </label>
                    <select
                      name="openHour"
                      value={data.openHour ?? ""}
                      onChange={handleGeneralChange}
                      className="mt-1 w-full rounded-md border-gray-300"
                    >
                      <option value="">--</option>
                      {hoursOptions.map((h) => (
                        <option key={`open-${h.value}`} value={h.value}>
                          {h.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hora de Cierre General
                    </label>
                    <select
                      name="closeHour"
                      value={data.closeHour ?? ""}
                      onChange={handleGeneralChange}
                      className="mt-1 w-full rounded-md border-gray-300"
                    >
                      <option value="">--</option>
                      {hoursOptions.map((h) => (
                        <option key={`close-${h.value}`} value={h.value}>
                          {h.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duración de Turnos
                    </label>
                    <select
                      name="slotDurationMinutes"
                      value={data.slotDurationMinutes ?? ""}
                      onChange={handleGeneralChange}
                      className="mt-1 w-full rounded-md border-gray-300"
                    >
                      <option value="">--</option>
                      {durationOptions.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Horarios por día */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  Horarios Específicos por Día
                </h3>
                <p className="text-sm text-gray-500">
                  Puedes sobreescribir el horario general para días específicos.
                  Déjalos en blanco para usar la configuración general.
                </p>
                <div className="space-y-4">
                  {Object.entries(dayMapping).map(([dayName, openKey]) => {
                    const closeKey = openKey.replace(
                      "Open",
                      "Close"
                    ) as keyof Omit<Schedule, "id" | "complexId">;
                    const openValue = data.schedule?.[openKey] ?? "";
                    const closeValue = data.schedule?.[closeKey] ?? "";
                    return (
                      <div
                        key={dayName}
                        className="grid grid-cols-3 gap-4 items-center"
                      >
                        <span className="font-medium text-sm">{dayName}</span>
                        <select
                          value={openValue}
                          onChange={(e) =>
                            handleScheduleChange(openKey, e.target.value)
                          }
                          className="w-full rounded-md border-gray-300 text-sm"
                        >
                          <option value="">Apertura (General)</option>
                          {hoursOptions.map((h) => (
                            <option
                              key={`${dayName}-open-${h.value}`}
                              value={h.value}
                            >
                              {h.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={closeValue}
                          onChange={(e) =>
                            handleScheduleChange(closeKey, e.target.value)
                          }
                          className="w-full rounded-md border-gray-300 text-sm"
                        >
                          <option value="">Cierre (General)</option>
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
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* --- Canchas --- */}
          {activeTab === "courts" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  Gestión de Canchas
                </h3>
                <button
                  type="button"
                  onClick={addNewCourt}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Cancha
                </button>
              </div>

              {/* Canchas existentes */}
              <div className="space-y-4">
                {data.courts.map((court) => (
                  <div
                    key={court.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 border rounded-lg"
                  >
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-500">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={court.name}
                        onChange={(e) =>
                          handleCourtChange(court.id, "name", e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500">
                        Deporte
                      </label>
                      <select
                        value={court.sport}
                        onChange={(e) =>
                          handleCourtChange(court.id, "sport", e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                      >
                        {sportsOptions.map((sport) => (
                          <option key={sport.value} value={sport.value}>
                            {sport.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500">
                        Precio / hora
                      </label>
                      <input
                        type="number"
                        value={court.pricePerHour}
                        onChange={(e) =>
                          handleCourtChange(
                            court.id,
                            "pricePerHour",
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500">
                        Monto Seña
                      </label>
                      <input
                        type="number"
                        value={court.depositAmount}
                        onChange={(e) =>
                          handleCourtChange(
                            court.id,
                            "depositAmount",
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={() => deleteCourt(court.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Nuevas canchas */}
                {newCourts.map((court) => (
                  <div
                    key={court.tempId}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50"
                  >
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-500">
                        Nombre *
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
                        placeholder="Ej: Cancha 1"
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500">
                        Deporte *
                      </label>
                      <select
                        value={court.sport}
                        onChange={(e) =>
                          handleNewCourtChange(
                            court.tempId,
                            "sport",
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                      >
                        {sportsOptions.map((sport) => (
                          <option key={sport.value} value={sport.value}>
                            {sport.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500">
                        Precio / hora *
                      </label>
                      <input
                        type="number"
                        value={court.pricePerHour}
                        onChange={(e) =>
                          handleNewCourtChange(
                            court.tempId,
                            "pricePerHour",
                            e.target.value
                          )
                        }
                        min="0"
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500">
                        Monto Seña
                      </label>
                      <input
                        type="number"
                        value={court.depositAmount}
                        onChange={(e) =>
                          handleNewCourtChange(
                            court.tempId,
                            "depositAmount",
                            e.target.value
                          )
                        }
                        min="0"
                        className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeNewCourt(court.tempId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Canchas marcadas para eliminar */}
              {courtsToDelete.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800">
                    Canchas marcadas para eliminar:
                  </h4>
                  <div className="mt-2 space-y-2">
                    {courtsToDelete.map((courtId) => (
                      <div
                        key={courtId}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-red-700">
                          Cancha ID: {courtId}
                        </span>
                        <button
                          type="button"
                          onClick={() => restoreCourt(courtId)}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Restaurar
                        </button>
                      </div>
                    ))}
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
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 disabled:bg-gray-400"
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
