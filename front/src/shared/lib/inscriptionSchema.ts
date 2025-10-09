import { z } from "zod";

export const inscriptionSchema = z.object({
  // --- Campos existentes ---
  ownerName: z.string().min(3, "Tu nombre es requerido."),
  ownerEmail: z.string().email("Debe ser un email válido."),
  ownerPhone: z.string().min(8, "Tu teléfono no parece válido."),
  complexName: z.string().min(3, "El nombre del complejo es requerido."),
  address: z.string().min(5, "La dirección es requerida."),
  city: z.string().min(3, "La ciudad es requerida."),
  province: z.string().min(3, "La provincia es requerida."),
  sports: z.string().min(1, "Debes seleccionar al menos un deporte."),
  selectedPlan: z.string(),
  selectedCycle: z.enum(["MENSUAL", "ANUAL"]),
  terms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones.",
  }),
});

export type InscriptionValues = z.infer<typeof inscriptionSchema>;
