import * as z from 'zod';

export const inscriptionSchema = z.object({
  ownerName: z.string().min(3, "El nombre es muy corto"),
  ownerPhone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  ownerEmail: z.string().email("El email no es válido"),
  complexName: z.string().min(3, "El nombre del complejo es muy corto"),
  address: z.string().min(5, "La dirección es muy corta"),
  city: z.string().min(3, "La ciudad es muy corta"),
  province: z.string().min(3, "La provincia es muy corta"),
  sports: z.string().min(3, "Menciona al menos un deporte"),
  selectedPlan: z.string(),
});

export type InscriptionValues = z.infer<typeof inscriptionSchema>;