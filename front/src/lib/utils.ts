import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const normalizePhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('549') && cleaned.length === 12) {
    return cleaned;
  }
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.length === 10) {
    return `549${cleaned}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('9')) {
    return `54${cleaned}`;
  }

  return cleaned;
};