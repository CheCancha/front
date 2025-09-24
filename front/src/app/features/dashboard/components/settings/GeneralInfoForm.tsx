import React from 'react';
import { FullComplexData } from '@/shared/entities/complex/types';

interface Props {
    data: FullComplexData;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const GeneralInfoForm = ({ data, onChange }: Props) => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold leading-6 text-gray-900">Información Básica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Complejo *</label>
                <input type="text" name="name" value={data.name} onChange={onChange} required className="mt-1 w-full rounded-md py-1 px-2 border border-neutral-300" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Dirección *</label>
                <input type="text" name="address" value={data.address} onChange={onChange} required className="mt-1 w-full rounded-md py-1 px-2 border border-neutral-300" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Ciudad *</label>
                <input type="text" name="city" value={data.city} onChange={onChange} required className="mt-1 w-full rounded-md py-1 px-2 border border-neutral-300" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Provincia *</label>
                <input type="text" name="province" value={data.province} onChange={onChange} required className="mt-1 w-full rounded-md py-1 px-2 border border-neutral-300" />
            </div>
        </div>
    </div>
);