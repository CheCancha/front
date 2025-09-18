// front/src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function normalizePhoneNumber(phone: string): string {
  // 1. Quitar todos los caracteres que no sean dígitos
  let digitsOnly = phone.replace(/\D/g, '');

  // 2. Si el número empieza con '0' (característica local), quitarlo.
  // Ej: 01154702119 -> 1154702119
  if (digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.substring(1);
  }

  // 3. Si después de quitar el '0', el número empieza con '15' (celular local), quitarlo.
  // Ej: 111554702119 -> 1154702119
  const areaCode = digitsOnly.substring(0, 2); // Asumimos area code de 2 dígitos como '11'
  if (areaCode === '11' && digitsOnly.substring(2, 4) === '15') {
      digitsOnly = areaCode + digitsOnly.substring(4);
  }
  
  // 4. Asegurarse de que el número tenga el prefijo de Argentina (54) y de celular (9)
  if (!digitsOnly.startsWith('549')) {
    if (digitsOnly.startsWith('54')) {
      // Si ya tiene 54 pero le falta el 9
      digitsOnly = '549' + digitsOnly.substring(2);
    } else {
      // Si no tiene nada, le agregamos todo
      digitsOnly = '549' + digitsOnly;
    }
  }

  return digitsOnly;
}