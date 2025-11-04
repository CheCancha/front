import type { Schedule } from "@prisma/client";

type ScheduleDayKey = Exclude<keyof Schedule, "id" | "complexId">;

export const hoursOptions = Array.from({ length: 60 }, (_, i) => {
  const totalHours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";

  const hourString = String(totalHours).padStart(2, "0");
  const value = `${hourString}:${minutes}`;
  
  let label = value;

  if (totalHours >= 24) {
    const nextDayHour = String(totalHours - 24).padStart(2, "0");
    label = ` ${nextDayHour}:${minutes} (del día sig.)`; 
  }

  return {
    value: value,
    label: label,
  };
});

export const durationOptions = [
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
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