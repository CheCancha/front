export function generateTimeSlots(openHour: string, closeHour: string, slotDurationMinutes: number) {
  const slots: { start: string; end: string }[] = [];

  const [openH, openM] = openHour.split(":").map(Number);
  const [closeH, closeM] = closeHour.split(":").map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  let current = openMinutes;

  while (current + slotDurationMinutes <= closeMinutes) {
    const startH = Math.floor(current / 60).toString().padStart(2, "0");
    const startM = (current % 60).toString().padStart(2, "0");
    const end = current + slotDurationMinutes;
    const endH = Math.floor(end / 60).toString().padStart(2, "0");
    const endM = (end % 60).toString().padStart(2, "0");

    slots.push({
      start: `${startH}:${startM}`,
      end: `${endH}:${endM}`,
    });

    current += slotDurationMinutes;
  }

  return slots;
}