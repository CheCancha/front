import React from 'react';
import MPButton from "@/app/features/dashboard/components/MPButton"; 
import { FullComplexData } from '@/shared/entities/complex/types';

interface Props {
    data: FullComplexData;
}

export const PaymentsSettings = ({ data }: Props) => (
    <div className="space-y-6">
        <MPButton complex={data} />
        {data.mp_connected_at && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800">Mercado Pago conectado exitosamente.</p>
                <p className="text-sm text-green-700">Conectado el {new Date(data.mp_connected_at).toLocaleDateString()}</p>
            </div>
        )}
    </div>
);