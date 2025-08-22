import React from "react";

const reservations = [
  { id: 1, cliente: "Juan Pérez", hora: "13:00", cancha: "Fútbol 5" },
  { id: 2, cliente: "María López", hora: "14:00", cancha: "Tenis" },
  { id: 3, cliente: "Carlos Díaz", hora: "15:00", cancha: "Pádel" },
  { id: 4, cliente: "Ana García", hora: "16:00", cancha: "Pádel 2" },
  { id: 5, cliente: "Luisa Fernández", hora: "17:00", cancha: "Pádel" },
  { id: 6, cliente: "Miguel Torres", hora: "18:00", cancha: "Fútbol 5" },
  { id: 7, cliente: "Sofía Ramírez", hora: "19:00", cancha: "Tenis" },
  { id: 8, cliente: "Diego Sánchez", hora: "20:00", cancha: "Pádel 2" },
  { id: 9, cliente: "Elena Gómez", hora: "21:00", cancha: "Pádel" },
  { id: 10, cliente: "Javier Martínez", hora: "22:00", cancha: "Fútbol 5" },
];

export function Reservations() {
  return (
    <div className="bg-white rounded-2xl shadow p-6 flex flex-col max-h-[650px]">
      <h2 className="text-lg font-semibold mb-4">Próximos Turnos</h2>

      <ul className="divide-y divide-gray-200 overflow-y-auto pr-2 flex-grow">
        {reservations.map((res) => (
          <li key={res.id} className="py-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{res.cliente}</p>
              <p className="text-sm text-gray-500">{res.cancha}</p>
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {res.hora}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
