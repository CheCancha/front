type ComplexWithManager = {
  id: string;
  name: string;
  manager: {
    name: string | null;
    phone: string | null;
  };
  subscriptionPlan: "Básico" | "Pro";
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
                <th className="p-3 font-medium text-gray-600">Nombre del Complejo</th>
                <th className="p-3 font-medium text-gray-600">Dueño / Manager</th>
                <th className="p-3 font-medium text-gray-600">WhatsApp</th>
                <th className="p-3 font-medium text-gray-600">Plan</th>
              </tr>
            </thead>
            <tbody>
              {complexes.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.manager.name}</td>
                  <td className="p-3">{c.manager.phone}</td>
                  <td className="p-3">{c.subscriptionPlan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
