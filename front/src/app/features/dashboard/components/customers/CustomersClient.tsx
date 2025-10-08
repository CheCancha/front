"use client";

import { useState, useMemo } from "react";
import type { CustomerData } from "@/app/(app)/dashboard/[complexId]/customers/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { CustomInput } from "@/shared/components/ui/Input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User, Phone, Calendar, Hash, DollarSign, Search } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    value
  );

export function CustomersClient({ customers }: { customers: CustomerData[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowercasedTerm) ||
        customer.phone?.includes(searchTerm) ||
        customer.email.toLowerCase().includes(lowercasedTerm)
    );
  }, [customers, searchTerm]);

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Listado de Clientes ({customers.length})
        </h3>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <CustomInput
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <User className="inline-block w-4 h-4 mr-2" />
                Cliente
              </TableHead>
              <TableHead>
                <Phone className="inline-block w-4 h-4 mr-2" />
                Contacto
              </TableHead>
              <TableHead className="text-center">
                <Hash className="inline-block w-4 h-4 mr-1" />
                Total Reservas
              </TableHead>
              <TableHead>
                <Calendar className="inline-block w-4 h-4 mr-2" />
                Última Reserva
              </TableHead>
              <TableHead className="text-right">
                <DollarSign className="inline-block w-4 h-4 mr-1" />
                Gasto Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{customer.email}</span>
                      <span className="text-xs text-gray-500">
                        {customer.phone || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {customer.totalBookings}
                  </TableCell>
                  <TableCell>
                    {customer.lastBookingDate
                      ? format(
                          new Date(customer.lastBookingDate),
                          "dd MMM, yyyy",
                          { locale: es }
                        )
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center h-24 text-gray-500"
                >
                  {searchTerm
                    ? "No se encontraron clientes con ese criterio."
                    : "Aún no hay clientes registrados."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
