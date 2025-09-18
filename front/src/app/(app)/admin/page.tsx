"use client";

import React, { useState, useEffect, startTransition } from 'react';
import { InscriptionRequest } from "@prisma/client";
import {  ButtonSecondary } from "@/shared/components/ui/Buttons";
import { InscriptionReviewModal } from '@/app/features/admin/components/InscriptionModal';
import { Spinner } from '@/shared/components/ui/Spinner';

// --- Componente UI para mostrar la tabla de solicitudes ---
const InscriptionRequestsTable = ({ 
    requests, 
    onRowClick 
}: { 
    requests: InscriptionRequest[],
    onRowClick: (request: InscriptionRequest) => void,
}) => {
    return (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Solicitudes Pendientes de Aprobación</h2>
            {requests.length === 0 ? (
                <p className="text-gray-500">No hay solicitudes pendientes en este momento.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b">
                            <tr>
                                <th className="p-3 font-medium text-gray-600">Nombre del Complejo</th>
                                <th className="p-3 font-medium text-gray-600">Nombre del Dueño</th>
                                <th className="p-3 font-medium text-gray-600">Email</th>
                                <th className="p-3 font-medium text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr 
                                    key={req.id} 
                                    className="border-b hover:bg-gray-50 cursor-pointer"
                                    onClick={() => onRowClick(req)}
                                >
                                    <td className="p-3">{req.complexName}</td>
                                    <td className="p-3">{req.ownerName}</td>
                                    <td className="p-3">{req.ownerEmail}</td>
                                    <td className="p-3">
                                        <ButtonSecondary >Revisar</ButtonSecondary>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// --- Componente de página principal (ahora es un Client Component) ---
export default function AdminDashboardPage() {
    const [requests, setRequests] = useState<InscriptionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<InscriptionRequest | null>(null);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/requests');
            if (!response.ok) {
                throw new Error('No se pudieron cargar las solicitudes');
            }
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Usamos useEffect para buscar los datos cuando el componente se monta
    useEffect(() => {
        fetchRequests();
    }, []);

    const handleOpenModal = (request: InscriptionRequest) => {
        setSelectedRequest(request);
    };

    const handleCloseModal = () => {
        setSelectedRequest(null);
        // Usamos startTransition para que la actualización de la UI no se sienta brusca
        startTransition(() => {
            fetchRequests();
        });
    };

    return (
        <>
            <InscriptionReviewModal
                isOpen={!!selectedRequest}
                onClose={handleCloseModal}
                request={selectedRequest}
            />

            <div className="space-y-8">
                <header>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de Administración</h1>
                    <p className="text-gray-600 mt-1">Gestiona las solicitudes de inscripción de nuevos complejos.</p>
                </header>
                
                {isLoading ? (
                    <div className="flex justify-center p-8"><Spinner /></div>
                ) : (
                    <InscriptionRequestsTable requests={requests} onRowClick={handleOpenModal} />
                )}
            </div>
        </>
    );
}

