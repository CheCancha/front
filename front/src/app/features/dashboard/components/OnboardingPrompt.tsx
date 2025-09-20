
import Link from "next/link";
import { ButtonPrimary } from "@/shared/components/ui/Buttons";
import { AlertCircle } from "lucide-react";

export function OnboardingPrompt({ complexId }: { complexId: string }) {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
      <AlertCircle className="h-6 w-6 text-yellow-600" />
      <div className="flex-grow">
        <h3 className="font-semibold text-yellow-800">
          ¡Bienvenido! Termina de configurar tu complejo
        </h3>
        <p className="text-sm text-yellow-700">
          Añade tus canchas y define tus horarios en la sección de Ajustes para
          empezar a recibir reservas.
        </p>
      </div>
      <ButtonPrimary>
        <Link href={`/dashboard/${complexId}/settings`}>Ir a Ajustes</Link>
      </ButtonPrimary>
    </div>
  );
}
