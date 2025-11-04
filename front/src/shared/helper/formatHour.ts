export const formatHour = (hourString: string | null | undefined): string => {
  if (!hourString) return "";
  try {
    const [hour, minutes] = hourString.split(":");
    const hourNum = parseInt(hour, 10);
    if (isNaN(hourNum)) return hourString;
    if (hourNum >= 24) {
      const nextDayHour = String(hourNum % 24).padStart(2, "0");
      return `${nextDayHour}:${minutes}`;
    }
    return hourString;
  } catch (e) {
    return hourString;
  }
};