"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/inputshadcn";
import { Label } from "@/shared/components/ui/label";
import { toast } from "react-hot-toast";
import { Court, User, FixedSlotType, Schedule } from "@prisma/client";
import { Trash2, Zap, Loader2, Plus, X } from "lucide-react";
// import { generateDynamicTimeSlots } from "@/shared/helper/schedule";
import { AddUserModal } from "./AddUserModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Tipos locales
type FixedSlotRule = {
  id: string;
  user: { id: string; name: string };
  court: { id: string; name: string };
  dayOfWeek: number;
  startTime: string;
  notes: string | null;
  type: FixedSlotType;
};
type ClientUser = Pick<User, "id" | "name">;

type ComplexScheduleData = {
  schedule: Schedule | null;
  timeSlotInterval: number;
};

const dayNames = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

interface AbonoManagerPanelProps {
  complexId: string;
  courts: Court[];
  onAbonosUpdated: () => void;
}

export function AbonoManagmentPanel({
  complexId,
  courts,
  onAbonosUpdated,
}: AbonoManagerPanelProps) {
  // --- ESTADOS DE DATOS ---
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [abonos, setAbonos] = useState<FixedSlotRule[]>([]);

  // --- ESTADOS DE UI ---
  const [isLoadingAbonos, setIsLoadingAbonos] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // --- ESTADOS DEL FORMULARIO ---
  const [userSearch, setUserSearch] = useState(""); // El texto del input
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const [rulesToDelete, setRulesToDelete] = useState<string[] | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");

  const [newCourt, setNewCourt] = useState<string>("");
  const [newDays, setNewDays] = useState<number[]>([]);
  const [newTime, setNewTime] = useState<string>("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [newType, setNewType] = useState<FixedSlotType>(
    FixedSlotType.CLIENTE_FIJO
  );
  const [complexConfig, setComplexConfig] =
    useState<ComplexScheduleData | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // 1. Carga los ABONOS existente
  const fetchAbonos = useCallback(async () => {
    setIsLoadingAbonos(true);
    try {
      const abonosRes = await fetch(`/api/fixed-slots?complexId=${complexId}`);
      if (!abonosRes.ok)
        throw new Error("No se pudieron cargar los turnos fijos.");
      const abonosData = await abonosRes.json();
      setAbonos(abonosData);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cargar abonos."
      );
    } finally {
      setIsLoadingAbonos(false);
    }
  }, [complexId]);

  // 2. Carga los USUARIOS (clientes) basado en la búsqueda
  const fetchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setUsers([]);
      return;
    }
    setIsLoadingUsers(true);
    try {
      const usersRes = await fetch(`/api/users?search=${searchQuery}`);
      if (!usersRes.ok) throw new Error("No se pudieron buscar los clientes.");
      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al buscar clientes."
      );
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const isSingleCourt = courts.length === 1;

  useEffect(() => {
    if (isSingleCourt) {
      setNewCourt((prev) => prev || courts[0].id);
    }
  }, [isSingleCourt, courts]);

  // Efecto para cargar Abonos (al inicio)
  useEffect(() => {
    if (complexId) {
      fetchAbonos();
    }
  }, [complexId, fetchAbonos]);

  useEffect(() => {
    if (selectedUser) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchUsers(userSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch, fetchUsers, selectedUser]);

  // Limpiar el formulario
  const clearForm = () => {
    setUserSearch("");
    setSelectedUser(null);
    setNewCourt("");
    setNewDays([]);
    setNewTime("");
    setNewPrice("");
    setNewNotes("");
    setNewType(FixedSlotType.CLIENTE_FIJO);
  };

  useEffect(() => {
    if (courts && Array.isArray(courts) && courts.length === 1) {
      setNewCourt(courts[0].id);
    }
  }, [courts]);

  const handleDayToggle = (dayIndex: number) => {
    if (!dayStatus[dayIndex]) {
      toast.error("Este día está configurado como cerrado.");
      return;
    }
    setNewDays((prevDays) =>
      prevDays.includes(dayIndex)
        ? prevDays.filter((d) => d !== dayIndex)
        : [...prevDays, dayIndex]
    );
    setNewTime("");
  };

  const handleCreateAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericPrice = parseFloat(newPrice);
    if (newPrice !== "" && (isNaN(numericPrice) || numericPrice < 0)) {
      toast.error("El precio debe ser un número válido (ej: 5000).");
      return;
    }
    if (
      newDays.length === 0 ||
      !selectedUser ||
      !newCourt ||
      !newTime ||
      !newType ||
      newPrice === ""
    ) {
      toast.error(
        "Completá todos los campos: Cliente, Cancha, Día, Hora, Tipo y Precio."
      );
      return;
    }
    setIsFormLoading(true);

    const selectedCourt = courts.find((c) => c.id === newCourt);
    if (!selectedCourt) {
      toast.error("Cancha no encontrada.");
      setIsFormLoading(false);
      return;
    }

    const [startHour, startMinute] = newTime.split(":").map(Number);
    const totalStartMinutes = startHour * 60 + startMinute;
    const totalEndMinutes =
      totalStartMinutes + selectedCourt.slotDurationMinutes;
    const endHour = Math.floor(totalEndMinutes / 60);
    const endMinute = totalEndMinutes % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(
      endMinute
    ).padStart(2, "0")}`;

    try {
      const creationPromises = newDays.map((dayIndex) => {
        return fetch("/api/fixed-slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            complexId,
            userId: selectedUser?.id,
            courtId: newCourt,
            dayOfWeek: dayIndex,
            startTime: newTime,
            endTime: endTime,
            startDate: new Date(),
            price: Number(newPrice),
            notes: newNotes,
            type: newType,
          }),
        });
      });

      const responses = await Promise.all(creationPromises);

      // --- 5. LÓGICA DE MANEJO DE ERRORES MEJORADA ---
      const successfulResponses: Response[] = [];
      const failedResponses: Response[] = [];

      for (const res of responses) {
        if (res.ok) {
          successfulResponses.push(res);
        } else {
          failedResponses.push(res);
        }
      }

      // 5a. Manejar errores (especialmente 409)
      if (failedResponses.length > 0) {
        // Buscamos el primer error de conflicto (409)
        const conflictResponse = failedResponses.find(
          (res) => res.status === 409
        );

        if (conflictResponse) {
          const errorMessage = await conflictResponse.text();
          setConflictMessage(errorMessage);
          setIsConflictModalOpen(true);
        } else {
          toast.error(`Error al crear ${failedResponses.length} regla(s).`);
        }
      }

      // 5b. Manejar éxitos (si hubo alguno)
      if (successfulResponses.length > 0) {
        toast.success(`Se creó un turno fijo con éxito!.`);

        const newRules = await Promise.all(
          successfulResponses.map((res) => res.json() as Promise<FixedSlotRule>)
        );
        const newRuleIds = newRules.map((rule) => rule.id);

        await handleGenerateTurns(newRuleIds, null);

        onAbonosUpdated();
        fetchAbonos();
      }

      // 5c. Solo limpiar el formulario si TODO salió bien
      if (failedResponses.length === 0) {
        clearForm();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsFormLoading(false);
    }
  };

  // --- LÓGICA "GENERAR TURNOS" ---
  const handleGenerateTurns = async (
    ruleIds: string[],
    groupId: string | null
  ) => {
    if (groupId) {
      setGeneratingId(groupId);
    }

    let generatedCount = 0;
    let errorCount = 0;

    // Iteramos y generamos por cada regla en el grupo
    for (const fixedSlotId of ruleIds) {
      try {
        const response = await fetch("/api/fixed-slots/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fixedSlotId, weeksToGenerate: 4 }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Error al generar.");
        }
        generatedCount++;
      } catch (error) {
        errorCount++;
        toast.error(
          `Error generando regla: ${
            error instanceof Error ? error.message : "Error"
          }`
        );
      }
    }

    if (generatedCount > 0) {
      toast.success(`Se generaron turnos para ${generatedCount} regla(s).`);
      onAbonosUpdated();
    }
    if (errorCount > 0) {
      toast.error(`Falló la generación para ${errorCount} regla(s).`);
    }

    if (groupId) {
      setGeneratingId(null);
    }
  };

  // Handler para Eliminar Abono
  const handleDeleteAbono = async () => {
    if (!rulesToDelete) return;

    setIsFormLoading(true);
    let deletedCount = 0;
    let errorCount = 0;

    for (const fixedSlotId of rulesToDelete) {
      try {
        const response = await fetch(`/api/fixed-slots/${fixedSlotId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("No se pudo eliminar la regla.");
        }
        deletedCount++;
      } catch (error) {
        errorCount++;
        toast.error(
          `Error al eliminar: ${
            error instanceof Error ? error.message : "Error"
          }`
        );
      }
    }

    if (deletedCount > 0) {
      toast.success(`Se eliminaron ${deletedCount} regla(s).`);
      // Actualizamos el estado local
      setAbonos(abonos.filter((a) => !rulesToDelete.includes(a.id)));
      onAbonosUpdated();
    }
    if (errorCount > 0) {
      toast.error(`Falló la eliminación de ${errorCount} regla(s).`);
    }

    setIsFormLoading(false);
    setRulesToDelete(null); // Cerramos el modal
  };

  const groupedAbonos = useMemo(() => {
    const groups: Record<
      string,
      {
        user: ClientUser;
        court: { id: string; name: string };
        startTime: string;
        type: FixedSlotType;
        notes: string | null;
        days: number[];
        ruleIds: string[];
      }
    > = {};

    const sortedAbonos = [...abonos].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    for (const abono of sortedAbonos) {
      const key = `${abono.user.id}-${abono.court.id}-${abono.startTime}-${
        abono.type
      }-${abono.notes ?? ""}`;

      if (!groups[key]) {
        groups[key] = {
          user: abono.user,
          court: abono.court,
          startTime: abono.startTime,
          type: abono.type,
          notes: abono.notes,
          days: [],
          ruleIds: [],
        };
      }

      groups[key].days.push(abono.dayOfWeek);
      groups[key].ruleIds.push(abono.id);
    }

    return Object.values(groups);
  }, [abonos]);

  useEffect(() => {
    if (!complexId) return;

    const fetchComplexConfig = async () => {
      setIsLoadingConfig(true);
      try {
        // Usamos la ruta GET que acabamos de crear
        const res = await fetch(`/api/complex/${complexId}/settings/schedule`);
        if (!res.ok) {
          throw new Error("No se pudo cargar la configuración del complejo.");
        }
        const configData: ComplexScheduleData = await res.json();
        setComplexConfig(configData);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al cargar config."
        );
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchComplexConfig();
  }, [complexId]);

  const dayIndexMapping = [
    { open: "sundayOpen", close: "sundayClose" },
    { open: "mondayOpen", close: "mondayClose" },
    { open: "tuesdayOpen", close: "tuesdayClose" },
    { open: "wednesdayOpen", close: "wednesdayClose" },
    { open: "thursdayOpen", close: "thursdayClose" },
    { open: "fridayOpen", close: "fridayClose" },
    { open: "saturdayOpen", close: "saturdayClose" },
  ] as const;

  const timeToMinutes = (timeStr: string | null | undefined): number | null => {
    if (!timeStr) return null;
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + (minutes || 0);
    } catch {
      return null;
    }
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // --- 2. DEFINIR 'dayStatus'
  const dayStatus = useMemo(() => {
    const status: { [key: number]: boolean } = {};
    const schedule = complexConfig?.schedule;

    for (let i = 0; i < 7; i++) {
      const keys = dayIndexMapping[i];
      if (!schedule || !keys) {
        status[i] = true;
        continue;
      }

      const openStr = schedule[keys.open];
      const closeStr = schedule[keys.close];

      status[i] = typeof openStr === "string" && typeof closeStr === "string";
    }
    return status;
  }, [complexConfig]);

  // --- 3. DEFINIR 'dynamicHoursOptions' DESPUÉS (ahora puede usar 'dayStatus' y helpers) ---
  const dynamicHoursOptions = useMemo(() => {
    if (newDays.length === 0 || !complexConfig) {
      return [];
    }

    const { schedule, timeSlotInterval } = complexConfig;
    const interval = timeSlotInterval || 60;
    const defaultOpen = "09:00";
    const defaultClose = "23:00";

    let latestStartTime = 0;
    let earliestEndTime = 1440;

    for (const dayIndex of newDays) {
      // Ahora 'dayStatus' está declarado ANTES y se puede usar
      if (!dayStatus[dayIndex]) return [];

      const keys = dayIndexMapping[dayIndex];
      if (!schedule || !keys) continue;

      const openStr = schedule[keys.open] ?? defaultOpen;
      const closeStr = schedule[keys.close] ?? defaultClose;

      // Ahora 'timeToMinutes' existe
      const openMinutes = timeToMinutes(openStr);
      const closeMinutes = timeToMinutes(closeStr);

      if (openMinutes === null || closeMinutes === null) return [];

      if (openMinutes > latestStartTime) latestStartTime = openMinutes;
      if (closeMinutes < earliestEndTime) earliestEndTime = closeMinutes;
    }

    if (latestStartTime >= earliestEndTime) return [];

    const options: { value: string; label: string }[] = [];
    for (
      let currentMinutes = latestStartTime;
      currentMinutes < earliestEndTime;
      currentMinutes += interval
    ) {
      // Ahora 'minutesToTime' existe
      const timeStr = minutesToTime(currentMinutes);
      options.push({ value: timeStr, label: timeStr });
    }
    return options;
  }, [newDays, complexConfig, dayStatus]);

  const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const isFormValid =
    selectedUser !== null &&
    newCourt !== "" &&
    newDays.length > 0 &&
    newTime !== "" &&
    newPrice !== "" &&
    !!newType;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
        <div className="md:col-span-1 space-y-4">
          <h3 className="font-semibold text-xl border-b pb-2">
            Crear Turno Fijo
          </h3>

          <form onSubmit={handleCreateAbono} className="space-y-4">
            <div className="space-y-2 relative">
              <Label>Cliente</Label>
              {selectedUser ? (
                // 1. Usuario Seleccionado
                <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                  <span className="font-medium">{selectedUser.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserSearch("");
                    }}
                  >
                    <X className="h-5 w-5 cursor-pointer" />
                  </Button>
                </div>
              ) : (
                // 2. Buscador (Input)
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      type="search"
                      placeholder="Buscar por nombre o email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsAddUserModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 3. Resultados (flotantes) */}
                  {(isLoadingUsers || users.length > 0) && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                      {isLoadingUsers && (
                        <div className="p-2 text-sm text-gray-500">
                          Buscando...
                        </div>
                      )}
                      {!isLoadingUsers &&
                        users.map((user) => (
                          <div
                            key={user.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedUser(user);
                              setUserSearch("");
                            }}
                          >
                            <p className="font-medium">{user.name}</p>
                          </div>
                        ))}
                    </div>
                  )}
                  {/* Mensaje si no hay resultados */}
                  {!isLoadingUsers &&
                    users.length === 0 &&
                    userSearch.length > 1 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg p-2 text-sm text-gray-500 mt-1">
                        No se encontraron clientes.
                      </div>
                    )}
                </>
              )}
            </div>
            {/* CANCHA */}
            {isSingleCourt ? (
              <div className="space-y-1">
                <Label>Cancha</Label>
                <p className="text-base font-semibold text-brand-dark">
                  {courts[0].name}
                </p>
                <input type="hidden" name="courtId" value={courts[0].id} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Cancha</Label>
                <Select
                  value={newCourt}
                  onValueChange={setNewCourt}
                  required
                  disabled={courts.length === 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí una cancha" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* DIA DE LA SEMANA */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Día(s) de la semana</Label>
                <div className="flex flex-wrap gap-2">
                  {dayLabels.map((label, index) => {
                    const isDayOpen = isLoadingConfig
                      ? false
                      : dayStatus[index];
                    const isSelected = newDays.includes(index);
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDayToggle(index)}
                        disabled={!isDayOpen || isLoadingConfig}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium",
                          isSelected
                            ? "bg-brand-dark text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                          (!isDayOpen || isLoadingConfig) &&
                            "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400"
                        )}
                        title={!isDayOpen ? "Día configurado como cerrado" : ""}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Mensaje de carga opcional */}
                {isLoadingConfig && (
                  <p className="text-sm text-gray-500 mt-1">
                    Cargando horarios...
                  </p>
                )}
              </div>

              {/* --- 2. SECCIÓN HORA DE INICIO --- */}
              <div className="space-y-2">
                <Label>Hora de Inicio</Label>
                <Select
                  value={newTime}
                  onValueChange={setNewTime}
                  required
                  disabled={newDays.length === 0 || isLoadingConfig}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingConfig
                          ? "Cargando..."
                          : newDays.length === 0
                          ? "Elegí un día primero"
                          : "Elegí una hora"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {dynamicHoursOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                    {/* Mensaje si no hay horas */}
                    {dynamicHoursOptions.length === 0 && (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        {newDays.length === 0
                          ? "Seleccioná al menos un día."
                          : "No hay horarios en común."}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CLIENTE, TIPO DE RESERVA, PRECIO Y MÉTODO DE PAGO */}
            <div>
              <Label className="mb-2">Tipo de Regla</Label>
              <Select
                value={newType}
                onValueChange={(v) => setNewType(v as FixedSlotType)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elegí un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FixedSlotType.CLIENTE_FIJO}>
                    Cliente Fijo (Abono)
                  </SelectItem>
                  <SelectItem value={FixedSlotType.ENTRENAMIENTO}>
                    Entrenamiento / Clase
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio del Turno</Label>
              <Input
                id="price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Ej: 5000"
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (Opcional)</Label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ej: Paga en efectivo"
              />
            </div>
            <Button
              type="submit"
              disabled={isFormLoading || !isFormValid}
              className="w-full"
            >
              {isFormLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isFormLoading ? "Creando..." : "Crear Turno Fijo"}
            </Button>
          </form>
        </div>

        {/* Columna 2: Abonos Existentes */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-semibold text-xl border-b pb-2">
            Turnos Fijos Activos
          </h3>
          {isLoadingAbonos && !abonos.length && <p>Cargando...</p>}
          {!isLoadingAbonos && !abonos.length && (
            <p className="text-sm text-gray-500 pt-4">
              No hay turnos fijos creados para este complejo.
            </p>
          )}

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            <TooltipProvider>
              {groupedAbonos.map((group) => {
                const groupId = group.ruleIds[0];
                const isGenerating = generatingId === groupId;

                return (
                  <div
                    key={groupId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg shadow-sm gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">
                          {group.user.name}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            group.type === "ENTRENAMIENTO"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-lime-200 text-brand-dark"
                          }`}
                        >
                          {group.type === "ENTRENAMIENTO" ? "Clase" : "Abono"}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700">
                        {group.court.name} -{" "}
                        <span className="font-medium text-black">
                          {group.days.map((day) => dayNames[day]).join(" y ")}{" "}
                          {group.startTime} hs
                        </span>
                      </p>
                      {group.notes && (
                        <p className="text-xs text-gray-700 mt-1 italic">
                          &quot;{group.notes}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 self-end sm:self-center">
                      <Tooltip delayDuration={500}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleGenerateTurns(group.ruleIds, groupId)
                            }
                            disabled={isLoadingAbonos || isGenerating}
                          >
                            {isGenerating ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="mr-2 h-4 w-4" />
                            )}
                            Generar 4 Turnos
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Crea las próximas 4 reservas para{" "}
                            <strong>cada día</strong> de este abono.
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      <Button
                        variant="destructive"
                        size="icon"
                        // Abrimos el modal de confirmación
                        onClick={() => setRulesToDelete(group.ruleIds)}
                        disabled={isLoadingAbonos || isGenerating}
                        title="Eliminar regla(s) de turno fijo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </div>
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserCreated={(newUser) => {
          setUsers([newUser, ...users]);
          setSelectedUser(newUser);
          setIsAddUserModalOpen(false);
          setUserSearch("");
        }}
      />

      <AlertDialog
        open={!!rulesToDelete}
        onOpenChange={(open) => !open && setRulesToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar esta regla de turno fijo. Esta acción también
              eliminará todos los turnos futuros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRulesToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAbono}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isConflictModalOpen}
        onOpenChange={setIsConflictModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Horario Superpuesto</AlertDialogTitle>
            <AlertDialogDescription>
              No se pudo crear la regla. El horario seleccionado ya está ocupado
              o se superpone con un turno existente.
              <br />
              <br />
              <span className="font-semibold text-red-600">
                {conflictMessage}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsConflictModalOpen(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
