import type { Schedule } from "@prisma/client";

type ScheduleDayKey = Exclude<keyof Schedule, "id" | "complexId">;

export const hoursOptions = Array.from({ length: 25 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, "0")}:00`,
}));

export const durationOptions = [
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "120 min" },
];

export const dayMapping: {
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