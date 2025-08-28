// import { PlusCircle, Search, User } from 'lucide-react';

// // Datos de ejemplo para los clientes
// const clientsData = [
//   { id: 1, name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '11-2233-4455', bookings: 12 },
//   { id: 2, name: 'Ana García', email: 'ana.garcia@email.com', phone: '11-5566-7788', bookings: 8 },
//   { id: 3, name: 'Carlos Díaz', email: 'carlos.diaz@email.com', phone: '11-9900-1122', bookings: 21 },
//   { id: 4, name: 'María López', email: 'maria.lopez@email.com', phone: '11-3344-5566', bookings: 5 },
// ];

// export default function ClientsPage() {
//   return (
//     <div className="space-y-6">
//       {/* --- Encabezado --- */}
//       <header className="flex flex-wrap items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
//           <p className="text-gray-600 mt-1">Gestiona la información de tus clientes.</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Buscar cliente..."
//               className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 sm:w-64"
//             />
//           </div>
//           <button className="ml-2 flex items-center gap-2 px-4 py-2 bg-black text-white font-semibold rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
//             <PlusCircle size={18} /> Añadir Cliente
//           </button>
//         </div>
//       </header>

//       {/* --- Tabla de Clientes --- */}
//       <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservas Totales</th>
//               <th scope="col" className="relative px-6 py-3">
//                 <span className="sr-only">Editar</span>
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {clientsData.map((client) => (
//               <tr key={client.id}>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
//                         <User size={20} className="text-gray-500"/>
//                     </div>
//                     <div className="ml-4">
//                       <div className="text-sm font-medium text-gray-900">{client.name}</div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">{client.email}</div>
//                   <div className="text-sm text-gray-500">{client.phone}</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{client.bookings}</td>
//                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                   <a href="#" className="text-indigo-600 hover:text-indigo-900">Editar</a>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }