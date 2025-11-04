// front/src/shared/helper/schedule.ts
import type { Schedule } from "@prisma/client";

/**
 * Convierte un string "HH:mm" a minutos totales.
 */
const timeToMinutes = (timeStr: string | null | undefined): number => {
  if (!timeStr) return 0;
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  } catch {
    return 0;
  }
};

/**
 * Convierte minutos totales a un string "HH:mm".
 */
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/**
 * Mapeo de índice de día (Date.getDay()) a las claves del modelo Schedule.
 * 0 = Domingo, 1 = Lunes, etc.
 */
const dayIndexMapping = [
  { open: "sundayOpen", close: "sundayClose" },
  { open: "mondayOpen", close: "mondayClose" },
  { open: "tuesdayOpen", close: "tuesdayClose" },
  { open: "wednesdayOpen", close: "wednesdayClose" },
  { open: "thursdayOpen", close: "thursdayClose" },
  { open: "fridayOpen", close: "fridayClose" },
  { open: "saturdayOpen", close: "saturdayClose" },
] as const;

interface TimeSlotOptions {
  /** El objeto de horarios del complejo */
  schedule: Schedule | null | undefined;
  /** El día de la semana (0 = Domingo, 1 = Lunes, ...) */
  dayOfWeek: number;
  /** El intervalo en minutos (30, 60, 90) */
  intervalMinutes: number;
  /** Hora de apertura por defecto si no está configurada */
  defaultOpen?: string;
  /** Hora de cierre por defecto si no está configurada */
  defaultClose?: string;
}

/**
 * Genera una lista de slots de tiempo válidos (ej. 18:00, 19:30, 21:00)
 * respetando el intervalo y los horarios de apertura/cierre del complejo.
 */
export const generateDynamicTimeSlots = ({
  schedule,
  dayOfWeek,
  intervalMinutes,
  defaultOpen = "09:00",
  defaultClose = "23:00",
}: TimeSlotOptions): { value: string; label: string }[] => {
  
  const options: { value: string; label: string }[] = [];
  const interval = intervalMinutes || 60; // Fallback

  // 1. Obtener las claves (ej. "mondayOpen") para el día
  const keys = dayIndexMapping[dayOfWeek];
  if (!keys) return options; // Día inválido

  // 2. Determinar las horas de apertura y cierre
  // Usamos el 'schedule' si existe, o caemos al 'default'
  const openString = (schedule && schedule[keys.open]) 
    ? schedule[keys.open] 
    : defaultOpen;
    
  const closeString = (schedule && schedule[keys.close])
    ? schedule[keys.close]
    : defaultClose;

  // 3. Si el día está cerrado (null), devolvemos array vacío
  if (!openString || !closeString) {
    return options; 
  }

  // 4. Convertir a minutos
  const startMinutes = timeToMinutes(openString);
  const endMinutes = timeToMinutes(closeString);

  // 5. Generar la lista de opciones
  for (
    let currentMinutes = startMinutes;
    currentMinutes < endMinutes; // < (menor estricto) para no incluir la hora de cierre
    currentMinutes += interval
  ) {
    const timeStr = minutesToTime(currentMinutes);
    options.push({
      value: timeStr,
      label: timeStr,
    });
  }

  return options;
};