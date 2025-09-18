// front/src/app/features/dashboard/components/SettingsForm.tsx

"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Complex, Schedule, Court, Sport } from "@prisma/client";
import { updateComplexSettings } from "@/app/features/dashboard/actions/settings-actions";
import { Trash2 } from "lucide-react";
import { ButtonGhost, ButtonPrimary } from "@/shared/components/ui/Buttons";

type FullComplexData = Complex & { schedule: Schedule | null; courts: Court[] };

export function SettingsForm({
  initialData,
}: {
  initialData: FullComplexData;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value ? parseInt(value) : null }));
  };

  const handleCourtChange = (
    index: number,
    field: keyof Omit<Court, "id" | "complexId" | "bookings">,
    value: string
  ) => {
    const newCourts = [...data.courts];
    const courtToUpdate = { ...newCourts[index] };

    if (field === "pricePerHour" || field === "depositAmount") {
      courtToUpdate[field] = parseInt(value, 10) || 0;
    } else if (field === "sport") {
      courtToUpdate.sport = value as Sport;
    } else {
      courtToUpdate.name = value;
    }
    newCourts[index] = courtToUpdate;
    setData((prev) => ({ ...prev, courts: newCourts }));
  };

  const addCourt = () => {
    const newCourt: Court = {
      id: `new_${Date.now()}`,
      name: "",
      sport: Sport.PADEL,
      pricePerHour: 0,
      depositAmount: 0,
      complexId: data.id,
    };
    setData((prev) => ({ ...prev, courts: [...prev.courts, newCourt] }));
  };

  const removeCourt = (idToRemove: string) => {
    setData((prev) => ({
      ...prev,
      courts: prev.courts.filter((c) => c.id !== idToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.courts.some((c) => !c.name.trim())) {
      toast.error("El nombre de cada cancha es obligatorio.");
      return;
    }
    setIsSaving(true);

    const result = await updateComplexSettings({
      complexId: data.id,
      general: {
        openHour: data.openHour!,
        closeHour: data.closeHour!,
        slotDurationMinutes: data.slotDurationMinutes!,
      },
      schedule: data.schedule || {},
      courts: data.courts.map((c) => ({
        id: c.id.startsWith("new_") ? undefined : c.id,
        name: c.name,
        sport: c.sport,
        pricePerHour: c.pricePerHour,
        depositAmount: c.depositAmount,
      })),
    });

    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success!);
      if (!data.onboardingCompleted) {
        router.push(`/dashboard/${data.id}`);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-lg border shadow-sm space-y-8 divide-y divide-gray-200"
    >
      {/* ... Aquí va todo tu JSX del formulario ... */}
      {/* Es exactamente el mismo JSX que tenías antes en tu `settings/page.tsx` */}
      {/* Lo pego aquí para que lo tengas completo: */}

      {!data.onboardingCompleted && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                ¡Último paso!
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Completa los datos de tu complejo y añade tus canchas. Al
                  guardar, tu complejo estará activo y listo para recibir
                  reservas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <section
        className={!data.onboardingCompleted ? "pt-0" : "pt-8 first:pt-0"}
      >
        <h3 className="text-lg font-semibold leading-6 text-gray-900">
          Configuración General
        </h3>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Apertura (General)
            </label>
            <select
              name="openHour"
              value={data.openHour ?? ""}
              onChange={handleGeneralChange}
              className="mt-1 w-full rounded-md border-gray-300"
            >
              {Array.from({ length: 25 }, (_, i) => (
                <option key={i} value={i}>{`${String(i).padStart(
                  2,
                  "0"
                )}:00`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cierre (General)
            </label>
            <select
              name="closeHour"
              value={data.closeHour ?? ""}
              onChange={handleGeneralChange}
              className="mt-1 w-full rounded-md border-gray-300"
            >
              {Array.from({ length: 25 }, (_, i) => (
                <option key={i} value={i}>{`${String(i).padStart(
                  2,
                  "0"
                )}:00`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duración Turnos
            </label>
            <select
              name="slotDurationMinutes"
              value={data.slotDurationMinutes ?? ""}
              onChange={handleGeneralChange}
              className="mt-1 w-full rounded-md border-gray-300"
            >
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </div>
        </div>
      </section>

      <section className="pt-8">
        <h3 className="text-lg font-semibold leading-6 text-gray-900">
          Gestión de Canchas
        </h3>
        <div className="mt-6 space-y-4">
          {data.courts.length > 0 ? (
            data.courts.map((court, index) => (
              <div
                key={court.id}
                className="grid grid-cols-12 gap-3 p-4 border rounded-lg items-end"
              >
                <div className="col-span-12 sm:col-span-4">
                  <label className="text-xs font-medium text-gray-600">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={court.name}
                    onChange={(e) =>
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
                    onChange={(e) =>
                      handleCourtChange(index, "sport", e.target.value)
                    }
                    className="w-full text-sm rounded-md border-gray-300"
                  >
                    {Object.values(Sport).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <label className="text-xs font-medium text-gray-600">
                    Precio/hr
                  </label>
                  <input
                    type="number"
                    value={court.pricePerHour}
                    onChange={(e) =>
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
                    value={court.depositAmount}
                    onChange={(e) =>
                      handleCourtChange(index, "depositAmount", e.target.value)
                    }
                    className="w-full text-sm rounded-md border-gray-300"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeCourt(court.id)}
                    className="w-full h-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-gray-500 py-4">
              Aún no has añadido ninguna cancha.
            </p>
          )}
          <ButtonGhost
            type="button"
            onClick={addCourt}
            className="w-full mt-2"
          >
            + Añadir Cancha
          </ButtonGhost>
        </div>
      </section>

      <div className="pt-8 flex justify-end">
        <ButtonPrimary type="submit" disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </ButtonPrimary>
      </div>
    </form>
  );
}
