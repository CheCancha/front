import { ComplexWithManager } from '@/shared/entities/complex/types';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapeos para mostrar nombres amigables
const planMap = {
  FREE: "Demo",
  BASE: "Básico",
  ESTANDAR: "Estándar",
  FULL: "Pro"
};

const cycleMap = {
  MENSUAL: "Mensual",
  ANUAL: "Anual"
};

// --- SUB-COMPONENTES PARA LA TABLA ---

// 1. Componente para el punto de estado del Onboarding (Verde/Amarillo)
const OnboardingStatusDot = ({ complex }: { complex: ComplexWithManager }) => {
  const tooltipParts = [
    `Canchas: ${complex.hasCourts ? '✓' : '✗'}`,
    `Horarios: ${complex.hasSchedule ? '✓' : '✗'}`,
    `Pagos: ${complex.hasPaymentInfo ? '✓' : '✗'}`,
  ];
  const tooltipText = tooltipParts.join(' | ');

  return (
    <div className="relative group flex items-center">
      <span className={`h-3 w-3 rounded-full ${complex.onboardingCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
      <div className="absolute bottom-full mb-2 -ml-8 hidden group-hover:block w-max bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
        {tooltipText}
      </div>
    </div>
  );
};

// 2. Componente para el estado de la suscripción (Activa, Prueba, etc.)
const SubscriptionStatusCell = ({ status, trialEndsAt }: { status: string, trialEndsAt: Date | null }) => {
  if (status === 'EN_PRUEBA' && trialEndsAt) {
    const daysLeft = differenceInDays(trialEndsAt, new Date());
    if (daysLeft > 0) {
      return <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-md">Prueba ({daysLeft} días)</span>;
    }
    return <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-md">Prueba Vencida</span>;
  }
  if (status === 'ATRASADA') {
    return <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-md">Atrasado</span>;
  }
  if (status === 'ACTIVA') {
    return <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-md">Activo</span>;
  }
  return <span>{status}</span>;
};

// 3. Componente para cada fila de la tabla (Este faltaba y causaba el error)
const ComplexRow = ({ complex }: { complex: ComplexWithManager }) => (
  <tr className="border-b hover:bg-gray-50 text-sm">
    <td className="p-3 flex items-center gap-3">
      <OnboardingStatusDot complex={complex} />
      <span className="font-medium">{complex.name}</span>
    </td>
    <td className="p-3">{complex.manager.name || 'N/A'}</td>
    <td className="p-3">{complex.manager.phone || 'N/A'}</td>
    <td className="p-3">
      <SubscriptionStatusCell status={complex.subscriptionStatus} trialEndsAt={complex.trialEndsAt} />
    </td>
    <td className="p-3">
      {planMap[complex.subscriptionPlan]}
      {complex.subscriptionCycle && ` (${cycleMap[complex.subscriptionCycle]})`}
    </td>
    <td className="p-3">
      {complex.subscribedAt ? format(new Date(complex.subscribedAt), 'dd MMM yyyy', { locale: es }) : 'N/A'}
    </td>
  </tr>
);

// --- COMPONENTE PRINCIPAL ---
export default function AdminDashboard({ complexes }: { complexes: ComplexWithManager[] }) {
  return (
    <div className="bg-[#f8f9f9] p-4 sm:p-6 rounded-lg border">
      <h2 className="text-lg font-semibold mb-4">Lista de Complejos</h2>
      {complexes.length === 0 ? (
        <p className="text-gray-500">No hay complejos para mostrar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 font-semibold">Complejo</th>
                <th className="p-3 font-semibold">Manager</th>
                <th className="p-3 font-semibold">Teléfono</th>
                <th className="p-3 font-semibold">Suscripción</th>
                <th className="p-3 font-semibold">Plan / Ciclo</th>
                <th className="p-3 font-semibold">Miembro Desde</th>
              </tr>
            </thead>
            <tbody>
              {complexes.map((c) => (
                <ComplexRow key={c.id} complex={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}