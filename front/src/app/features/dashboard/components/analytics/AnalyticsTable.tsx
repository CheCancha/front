"use client";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);

type TopCustomer = { name: string; bookingsCount: number; totalSpent: number };
type CourtBreakdown = {
  name: string;
  totalIncome: number;
  totalBookings: number;
};

export function AnalyticsTables({
  topCustomers,
  courtsBreakdown,
}: {
  topCustomers: TopCustomer[];
  courtsBreakdown: CourtBreakdown[];
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Tabla de Top Clientes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Ranking de Clientes</h3>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <ul className="divide-y divide-gray-200">
            {topCustomers.map((customer, index) => (
              <li
                key={index}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-gray-500">
                    {customer.bookingsCount} reservas
                  </p>
                </div>
                <p className="font-semibold">
                  {formatCurrency(customer.totalSpent)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Desglose por Cancha</h3>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <ul className="divide-y divide-gray-200">
            {courtsBreakdown.map((court, index) => (
              <li
                key={index}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{court.name}</p>
                  <p className="text-sm text-gray-500">
                    {court.totalBookings} reservas
                  </p>
                </div>
                <p className="font-semibold">
                  {formatCurrency(court.totalIncome)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
