"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock } from 'lucide-react';

export type SearchResult = {
  id: string;
  slug: string;
  name: string;
  address: string;
  imageUrl: string;
  availableSlots: { time: string }[];
  latitude: number | null;
  longitude: number | null;
};

interface ComplexListProps {
  complexes: SearchResult[];
}

export const ComplexList: React.FC<ComplexListProps> = ({ complexes }) => {
  return (
    <div className="space-y-6">
      {complexes.map((complex) => (
        <Link href={`/canchas/${complex.slug}`} key={complex.id}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-shadow duration-300">
            <div className="relative w-full md:w-1/3 h-48 md:h-auto">
              <Image
                src={complex.imageUrl}
                alt={`Imagen de ${complex.name}`}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-6 flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-xl font-bold text-foreground">{complex.name}</h3>
                <p className="text-sm text-paragraph flex items-center gap-2 mt-1">
                  <MapPin size={14} /> {complex.address}
                </p>
              </div>
              {complex.availableSlots.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Clock size={14} /> Próximos turnos disponibles:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {complex.availableSlots.map((slot) => (
                      <span key={slot.time} className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        {slot.time}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};