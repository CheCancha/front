"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import { Spinner } from "@/shared/components/ui/Spinner";
import {
  FullComplexData,
  CourtWithRelations,
} from "@/shared/entities/complex/types";
import { NewCourt, NewPriceRule } from "@/shared/entities/complex/types";
import { ScheduleForm } from "./ScheduleForm";
import { CourtsManager } from "./CourtsManager";
import ImageSettings from "./ImageSettings";
import { PaymentsSettings } from "./PaymentsSettings";
import { Schedule, Sport, PriceRule } from "@prisma/client";
import { GeneralInfoForm } from "./GeneralInfoForm";

type ScheduleDayKey = Exclude<keyof Schedule, "id" | "complexId">;

const TABS = [
  { id: "general", label: "Información General" },
  { id: "schedule", label: "Horarios" },
  { id: "courts", label: "Canchas" },
  { id: "images", label: "Imágenes" },
  { id: "payments", label: "Pagos" },
];

export const ComplexSettings = () => {
  const params = useParams();
  const complexId = params.complexId as string;

  // --- ESTADOS PRINCIPALES ---
  const [data, setData] = useState<FullComplexData | null>(null);
  const [originalData, setOriginalData] = useState<FullComplexData | null>(
    null
  );
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [newCourts, setNewCourts] = useState<NewCourt[]>([]);
  const [courtsToDelete, setCourtsToDelete] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
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
      setOriginalData(JSON.parse(JSON.stringify(complexData)));
      setAllSports(sportsData);
      setNewCourts([]);
      setCourtsToDelete([]);
      setImagesToDelete([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [complexId]);

  useEffect(() => {
    fetchComplexData();
  }, [fetchComplexData]);

  // --- MANEJADORES DE ESTADO GENERALES ---
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

  // --- MANEJADORES PARA IMÁGENES ---
  const deleteImage = (imageId: string) => {
    const imageToDelete = data?.images.find((img) => img.id === imageId);
    if (imageToDelete?.isPrimary) {
      toast.error(
        "No puedes eliminar la imagen de portada. Elige otra primero."
      );
      return;
    }

    setImagesToDelete((prev) => [...prev, imageId]);
    setData((prev) =>
      prev
        ? { ...prev, images: prev.images.filter((img) => img.id !== imageId) }
        : null
    );
  };

  const restoreImage = (imageId: string) => {
    const imageToRestore = originalData?.images.find(
      (img) => img.id === imageId
    );
    if (imageToRestore && data) {
      setImagesToDelete((prev) => prev.filter((id) => id !== imageId));
      setData({
        ...data,
        images: [...data.images, imageToRestore].sort((a, b) =>
          a.id.localeCompare(b.id)
        ),
      });
    }
  };

  // --- MANEJADORES PARA CANCHAS Y REGLAS DE PRECIOS ---
  const handleCourtChange = (
    courtId: string,
    field: string,
    value: string | number
  ) => {
    if (courtId.startsWith("new_")) {
      setNewCourts((prev) =>
        prev.map((c) =>
          c.tempId === courtId ? { ...c, [field as keyof NewCourt]: value } : c
        )
      );
    } else {
      setData((prev) => {
        if (!prev) return null;
        const updatedCourts = prev.courts.map((c) =>
          c.id === courtId
            ? { ...c, [field as keyof CourtWithRelations]: value }
            : c
        );
        return { ...prev, courts: updatedCourts };
      });
    }
  };

  const handlePriceRuleChange = (
    courtId: string,
    ruleId: string,
    field: string,
    value: number
  ) => {
    const updateRulesForCourt = <T extends NewCourt | CourtWithRelations>(
      court: T
    ): T => {
      const updatedRules = court.priceRules.map((rule) => {
        const currentRuleId = "tempId" in rule ? rule.tempId : rule.id;

        if (currentRuleId === ruleId) {
          return { ...rule, [field]: value };
        }
        return rule;
      });

      return { ...court, priceRules: updatedRules as T["priceRules"] };
    };

    if (courtId.startsWith("new_")) {
      setNewCourts((prev) =>
        prev.map((court) =>
          court.tempId === courtId ? updateRulesForCourt(court) : court
        )
      );
    } else {
      setData((prev) => {
        if (!prev) return null;
        const updatedCourts = prev.courts.map((court) =>
          court.id === courtId ? updateRulesForCourt(court) : court
        );
        return { ...prev, courts: updatedCourts };
      });
    }
  };

  const addPriceRule = (courtId: string) => {
    const newRule: NewPriceRule = {
      tempId: `new_price_${Date.now()}`,
      startTime: 9,
      endTime: 23,
      price: 0,
      depositPercentage: 30,
    };

    if (courtId.startsWith("new_")) {
      setNewCourts((prev) =>
        prev.map((c) =>
          c.tempId === courtId
            ? { ...c, priceRules: [...c.priceRules, newRule] }
            : c
        )
      );
    } else {
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          courts: prev.courts.map((c) =>
            c.id === courtId
              ? { ...c, priceRules: [...c.priceRules, newRule] }
              : c
          ),
        };
      });
    }
  };

  const removePriceRule = (courtId: string, ruleId: string) => {
    const filterRules = (court: NewCourt | CourtWithRelations) => {
      if (court.priceRules.length <= 1) {
        toast.error("Cada cancha debe tener al menos una regla de precio.");
        return court;
      }
      const filteredRules = court.priceRules.filter((r) => {
        const currentRuleId = "tempId" in r ? r.tempId : r.id;
        return currentRuleId !== ruleId;
      });
      return { ...court, priceRules: filteredRules };
    };

    if (courtId.startsWith("new_")) {
      setNewCourts((prev) =>
        prev.map((c) =>
          c.tempId === courtId ? (filterRules(c) as NewCourt) : c
        )
      );
    } else {
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          courts: prev.courts.map((c) =>
            c.id === courtId ? (filterRules(c) as CourtWithRelations) : c
          ),
        };
      });
    }
  };

  const addNewCourt = () => {
    if (allSports.length === 0) return toast.error("Cargando deportes...");

    const newCourt: NewCourt = {
      tempId: `new_${Date.now()}`,
      name: "",
      sportId: allSports[0].id,
      slotDurationMinutes: 60,
      priceRules: [
        {
          tempId: `new_price_${Date.now()}`,
          startTime: 9,
          endTime: 23,
          price: 0,
          depositPercentage: 30,
        },
      ],
      isNew: true,
    };
    setNewCourts((prev) => [...prev, newCourt]);
  };

  const deleteCourt = (courtId: string) => {
    if (courtId.startsWith("new_")) {
      setNewCourts((prev) => prev.filter((c) => c.tempId !== courtId));
    } else {
      setCourtsToDelete((prev) => [...prev, courtId]);
      setData((prev) =>
        prev
          ? { ...prev, courts: prev.courts.filter((c) => c.id !== courtId) }
          : null
      );
    }
  };

  const restoreCourt = (courtId: string) => {
    const courtToRestore = originalData?.courts.find((c) => c.id === courtId);
    if (courtToRestore && data) {
      setCourtsToDelete((prev) => prev.filter((id) => id !== courtId));
      setData({
        ...data,
        courts: [...data.courts, courtToRestore].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !originalData) return;

    setIsSaving(true);
    toast.loading("Guardando cambios...");

    try {
      if (activeTab === "images") {
        if (imagesToDelete.length > 0) {
          const deletePromises = imagesToDelete.map((id) =>
            fetch(`/api/complex/${complexId}/image/${id}`, { method: "DELETE" })
          );
          const deleteResults = await Promise.all(deletePromises);

          const failedDeletes = deleteResults.filter((res) => !res.ok);
          if (failedDeletes.length > 0) {
            throw new Error(
              `No se pudieron eliminar ${failedDeletes.length} imágenes.`
            );
          }
        }

        const updatePayload = {
          images: data.images.map((img) => ({
            id: img.id,
            isPrimary: img.isPrimary,
          })),
        };

        const updateResponse = await fetch(
          `/api/complex/${complexId}/settings/images`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatePayload),
          }
        );

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(
            errorData.error || `Error al actualizar la imagen principal.`
          );
        }
      } else {
        let endpoint = "";
        let payload = {};

        switch (activeTab) {
          case "general":
            endpoint = `/api/complex/${complexId}/settings/general`;
            payload = {
              basicInfo: {
                name: data.name,
                address: data.address,
                city: data.city,
                province: data.province,
              },
            };
            break;

          case "schedule":
            endpoint = `/api/complex/${complexId}/settings/schedule`;
            payload = { schedule: data.schedule };
            break;

          case "courts":
            endpoint = `/api/complex/${complexId}/settings/courts`;
            payload = {
              courts: {
                update: data.courts.map((c) => {
                  const originalCourt = originalData.courts.find(
                    (oc) => oc.id === c.id
                  );
                  return {
                    id: c.id,
                    name: c.name,
                    sportId: c.sportId,
                    slotDurationMinutes: c.slotDurationMinutes,
                    priceRules: {
                      delete:
                        originalCourt?.priceRules
                          .filter((rule): rule is PriceRule => "id" in rule)
                          .filter(
                            (opr) =>
                              !c.priceRules.some(
                                (pr) => "id" in pr && pr.id === opr.id
                              )
                          )
                          .map((pr) => ({ id: pr.id })) || [],
                      update: c.priceRules
                        .filter((pr): pr is PriceRule => "id" in pr)
                        .map((pr) => ({
                          where: { id: pr.id },
                          data: {
                            startTime: pr.startTime,
                            endTime: pr.endTime,
                            price: pr.price,
                            depositPercentage: pr.depositPercentage,
                          },
                        })),
                      create: c.priceRules
                        .filter((pr): pr is NewPriceRule => "tempId" in pr)
                        .map((pr) => ({
                          startTime: pr.startTime,
                          endTime: pr.endTime,
                          price: pr.price,
                          depositPercentage: pr.depositPercentage,
                        })),
                    },
                  };
                }),
                create: newCourts.map((c) => ({
                  name: c.name,
                  sportId: c.sportId,
                  slotDurationMinutes: c.slotDurationMinutes,
                  priceRules: {
                    create: c.priceRules.map((pr) => ({
                      startTime: pr.startTime,
                      endTime: pr.endTime,
                      price: pr.price,
                      depositPercentage: pr.depositPercentage,
                    })),
                  },
                })),
                delete: courtsToDelete.map((id) => ({ id })),
              },
            };
            break;

          default:
            toast.dismiss();
            setIsSaving(false);
            toast.error(
              `La pestaña "${activeTab}" no tiene una acción de guardado.`
            );
            return;
        }

        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Error al guardar en la pestaña ${activeTab}`
          );
        }
      }

      toast.dismiss();
      toast.success("¡Cambios guardados con éxito!");
      fetchComplexData();
    } catch (error) {
      toast.dismiss();
      toast.error(
        error instanceof Error ? error.message : "Error desconocido al guardar"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-8 flex justify-center items-center">
        <Spinner />
      </div>
    );
  if (!data)
    return (
      <div className="p-8">No se encontró la configuración del complejo.</div>
    );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Configuración del Club
        </h1>
        <p className="text-gray-600 mt-1">
          Gestiona la información de tu complejo.
        </p>
      </header>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg border shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {activeTab === "general" && (
            <GeneralInfoForm data={data} onChange={handleBasicInfoChange} />
          )}
          {activeTab === "schedule" && (
            <ScheduleForm data={data} onChange={handleScheduleChange} />
          )}
          {activeTab === "courts" && (
            <CourtsManager
              data={data}
              originalData={originalData}
              allSports={allSports}
              newCourts={newCourts}
              courtsToDelete={courtsToDelete}
              onCourtChange={handleCourtChange}
              onDeleteCourt={deleteCourt}
              onAddNewCourt={addNewCourt}
              onRestoreCourt={restoreCourt}
              onPriceRuleChange={handlePriceRuleChange}
              onAddPriceRule={addPriceRule}
              onRemovePriceRule={removePriceRule}
            />
          )}
          {activeTab === "images" && data && originalData && (
            <ImageSettings
              data={data}
              setData={setData}
              complexId={complexId}
              originalData={originalData}
              imagesToDelete={imagesToDelete}
              onDeleteImage={deleteImage}
              onRestoreImage={restoreImage}
            />
          )}
          {activeTab === "payments" && <PaymentsSettings data={data} />}

          <div className="flex justify-between items-center pt-8 border-t">
            <button
              type="button"
              onClick={() => fetchComplexData()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar Cambios
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 disabled:bg-gray-400 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Spinner className="mr-2" /> Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
