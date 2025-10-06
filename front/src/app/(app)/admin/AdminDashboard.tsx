import { ComplexWithManager } from '@/shared/entities/complex/types';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const planMap = {
  FREE: "Demo",
  BASE: "Básico",
  FULL: "Pro"
};

const cycleMap = {
  MENSUAL: "Mensual",
  ANUAL: "Anual"
};

// Componente para renderizar la celda de Estado/Vencimiento
const StatusCell = ({ status, trialEndsAt }: { status: string, trialEndsAt: Date | null }) => {
  if (status === 'EN_PRUEBA' && trialEndsAt) {
    const daysLeft = differenceInDays(trialEndsAt, new Date());
    if (daysLeft > 0) {
      return <span className="text-yellow-600">Prueba (vence en {daysLeft} días)</span>;
    }
    return <span className="text-red-600">Prueba Vencida</span>;
  }
  if (status === 'ATRASADA') {
    return <span className="text-red-600">Atrasado</span>;
  }
  if (status === 'ACTIVA') {
    return <span className="text-green-600">Activo</span>;
  }
  return <span>{status}</span>;
};

export default function AdminDashboard({ complexes }: { complexes: ComplexWithManager[] }) {
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Complejos Activos</h2>
      {complexes.length === 0 ? (
        <p className="text-gray-500">No hay complejos activos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                {/* 2. Actualizamos las columnas de la tabla */}
                <th className="p-3 font-medium text-gray-600">Nombre del Complejo</th>
                <th className="p-3 font-medium text-gray-600">Dueño / Manager</th>
                <th className="p-3 font-medium text-gray-600">WhatsApp</th>
                <th className="p-3 font-medium text-gray-600">Estado / Vencimiento</th>
                <th className="p-3 font-medium text-gray-600">Plan / Ciclo</th>
                <th className="p-3 font-medium text-gray-600">Miembro Desde</th>
              </tr>
            </thead>
            <tbody>
              {complexes.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.manager.name}</td>
                  <td className="p-3">{c.manager.phone}</td>
                  {/* 3. Renderizamos las celdas con la nueva lógica */}
                  <td className="p-3">
                    <StatusCell status={c.subscriptionStatus} trialEndsAt={c.trialEndsAt} />
                  </td>
                  <td className="p-3">
                    {planMap[c.subscriptionPlan]}
                    {c.subscriptionCycle && ` (${cycleMap[c.subscriptionCycle]})`}
                  </td>
                  <td className="p-3">
                    {c.subscribedAt ? format(new Date(c.subscribedAt), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}