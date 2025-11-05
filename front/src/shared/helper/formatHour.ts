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


export const formatHourSafely = (timeStr: string): string => {
    let hourStr = "00";
    let minuteStr = "00";

    // 1. Separar horas y minutos
    if (timeStr.includes(":")) {
      const parts = timeStr.split(":");
      hourStr = parts[0];
      minuteStr = parts[1];
    } else {
      hourStr = timeStr;
      // minuteStr ya es "00" por defecto
    }

    // 2. Convertir la hora a número
    const hourNum = parseInt(hourStr, 10);

    // 3. Calcular la hora real (¡esta es la magia!)
    //    27 % 24 = 3
    //    24 % 24 = 0
    //    12 % 24 = 12
    const displayHour = hourNum % 24;

    // 4. Formatear y devolver el resultado
    const formattedHour = String(displayHour).padStart(2, "0");
    const formattedMinutes = minuteStr.padStart(2, "0");

    return `${formattedHour}:${formattedMinutes}`;
  };