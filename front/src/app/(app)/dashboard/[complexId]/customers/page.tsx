import { db } from "@/shared/lib/db";
import { authorizeAndVerify } from "@/shared/lib/authorize";
import { CustomersClient } from "@/app/features/dashboard/components/customers/CustomersClient";
import { BookingStatus } from "@prisma/client";

// Tipos de datos para la página de clientes
export type CustomerData = {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  totalBookings: number;
  lastBookingDate: Date | null;
  totalSpent: number;
};

// Función para obtener y procesar los datos de los clientes
async function getCustomerData(complexId: string): Promise<CustomerData[]> {
  const bookings = await db.booking.findMany({
    where: {
      court: { complexId: complexId },
      status: { in: [BookingStatus.CONFIRMADO, BookingStatus.COMPLETADO] },
      userId: { not: null },
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  const customerMap = new Map<string, CustomerData>();

  for (const booking of bookings) {
    if (booking.user) {
      if (!customerMap.has(booking.user.id)) {
        customerMap.set(booking.user.id, {
          id: booking.user.id,
          name: booking.user.name || "Sin Nombre",
          phone: booking.user.phone,
          email: booking.user.email,
          totalBookings: 0,
          lastBookingDate: null,
          totalSpent: 0,
        });
      }

      const customer = customerMap.get(booking.user.id)!;
      customer.totalBookings += 1;
      customer.totalSpent += booking.totalPrice;
      if (!customer.lastBookingDate) {
        customer.lastBookingDate = booking.date;
      }
    }
  }

  return Array.from(customerMap.values());
}

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ complexId: string }>;
}) {
  const { complexId } = await params;

  const { complex, error } = await authorizeAndVerify(complexId);
  if (error) return error;

  const customers = await getCustomerData(complexId);

  return (
    <div className="space-y-6">
      <CustomersClient customers={customers} />
    </div>
  );
}
