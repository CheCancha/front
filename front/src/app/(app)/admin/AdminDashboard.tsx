"use client";

import { ComplexWithManager } from "@/shared/entities/complex/types";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Mail, Edit, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { resendWelcomeEmail } from "@/app/features/admin/inscriptionActions";
import { EditManagerModal } from "@/app/features/admin/components/EditManagerModal";
import { useRouter } from "next/navigation";
import { CreateComplexModal } from "@/app/features/admin/components/CreateComplexModal";

const planMap = {
  FREE: "Demo",
  BASE: "Básico",
  ESTANDAR: "Estándar",
  FULL: "Pro",
};
const cycleMap = { MENSUAL: "Mensual", ANUAL: "Anual" };

// --- SUB-COMPONENTES PARA LA TABLA ---
const OnboardingStatusDot = ({ complex }: { complex: ComplexWithManager }) => {
  const tooltipParts = [
    `Canchas: ${complex.hasCourts ? "✓" : "✗"}`,
    `Horarios: ${complex.hasSchedule ? "✓" : "✗"}`,
    `Pagos: ${complex.hasPaymentInfo ? "✓" : "✗"}`,
  ];
  const tooltipText = tooltipParts.join(" | ");

  return (
    <div className="relative group flex items-center">
      <span
        className={`h-3 w-3 rounded-full ${
          complex.onboardingCompleted ? "bg-green-500" : "bg-yellow-500"
        }`}
      ></span>
      <div className="absolute bottom-full mb-2 -ml-8 hidden group-hover:block w-max bg-gray-800 text-background text-xs rounded py-1 px-2 z-10">
        {tooltipText}
      </div>
    </div>
  );
};

const SubscriptionStatusCell = ({
  status,
  trialEndsAt,
}: {
  status: string;
  trialEndsAt: Date | null;
}) => {
  if (status === "EN_PRUEBA" && trialEndsAt) {
    const daysLeft = differenceInDays(trialEndsAt, new Date());
    if (daysLeft > 0) {
      return (
        <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-md">
          Prueba ({daysLeft} días)
        </span>
      );
    }
    return (
      <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
        Prueba Vencida
      </span>
    );
  }
  if (status === "ATRASADA")
    return (
      <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
        Atrasado
      </span>
    );
  if (status === "ACTIVA")
    return (
      <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-md">
        Activo
      </span>
    );
  return <span>{status}</span>;
};

// --- Componente para el Menú de Acciones ---
const ComplexActions = ({
  manager,
  onEdit,
}: {
  manager: ComplexWithManager["manager"];
  onEdit: () => void;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleResendEmail = () => {
    if (!manager?.id || !manager.name) return;
    startTransition(async () => {
      toast.loading(`Reenviando email a ${manager.name}...`);
      const result = await resendWelcomeEmail(manager.id);
      toast.dismiss();
      if (result.success) {
        toast.success("Email de bienvenida reenviado con éxito.");
      } else {
        toast.error(`Error: ${result.error}`);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleResendEmail} disabled={isPending}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Reenviar Email Bienvenida</span>
        </DropdownMenuItem>
        {/* --- 2. Habilitar el botón de editar --- */}
        <DropdownMenuItem onSelect={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Editar Manager</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ComplexRow = ({
  complex,
  onEditManager,
}: {
  complex: ComplexWithManager;
  onEditManager: (manager: ComplexWithManager["manager"]) => void;
}) => (
  <tr className="border-b hover:bg-gray-50 text-sm">
    <td className="p-3 flex items-center gap-3">
      <OnboardingStatusDot complex={complex} />
      <span className="font-medium">{complex.name}</span>
    </td>
    <td className="p-3">{complex.manager.name || "N/A"}</td>
    <td className="p-3">{complex.manager.email || "N/A"}</td>
    <td className="p-3">{complex.manager.phone || "N/A"}</td>
    <td className="p-3">
      <SubscriptionStatusCell
        status={complex.subscriptionStatus}
        trialEndsAt={complex.trialEndsAt}
      />
    </td>
    <td className="p-3">
      {planMap[complex.subscriptionPlan]}
      {complex.subscriptionCycle && ` (${cycleMap[complex.subscriptionCycle]})`}
    </td>
    <td className="p-3">
      {complex.subscribedAt
        ? format(new Date(complex.subscribedAt), "dd MMM yyyy", { locale: es })
        : "N/A"}
    </td>
    <td className="p-3 text-right">
      {complex.manager.id && (
        <ComplexActions
          manager={complex.manager}
          onEdit={() => onEditManager(complex.manager)}
        />
      )}
    </td>
  </tr>
);

// --- COMPONENTE PRINCIPAL ---
export default function AdminDashboard({
  complexes,
}: {
  complexes: ComplexWithManager[];
}) {
  // --- 3. Añadir estados para controlar el modal de edición ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<
    ComplexWithManager["manager"] | null
  >(null);
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenEditModal = (manager: ComplexWithManager["manager"]) => {
    setSelectedManager(manager);
    setIsEditModalOpen(true);
  };

  const handleCreationSuccess = () => {
    // Cuando la creación es exitosa, refrescamos la data del Server Component
    router.refresh();
  };

  return (
    <>
      {/* --- LISTA DE COMPLEJOS EXISTENTES --- */}
      <div className="bg-[#f8f9f9] p-4 sm:p-6 rounded-lg border">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Lista de Complejos</h2>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Complejo
            </Button>
        </div>
        {complexes.length === 0 ? (
          <p className="text-gray-500">No hay complejos para mostrar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-3 font-semibold">Complejo</th>
                  <th className="p-3 font-semibold">Manager</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Teléfono</th>
                  <th className="p-3 font-semibold">Suscripción</th>
                  <th className="p-3 font-semibold">Plan / Ciclo</th>
                  <th className="p-3 font-semibold">Miembro Desde</th>
                  <th className="p-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {complexes.map((c) => (
                  <ComplexRow
                    key={c.id}
                    complex={c}
                    onEditManager={handleOpenEditModal}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* --- 4. Renderizar el modal --- */}
      <EditManagerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        manager={selectedManager}
      />
      <CreateComplexModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreationSuccess}
      />
    </>
  );
}
