"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Club } from '@/app/(public)/canchas/page';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error - Este es un workaround conocido para un bug de compatibilidad
// entre React-Leaflet y el App Router de Next.js que impide que los íconos se muestren.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

interface ComplexesMapProps {
  complexes: Club[];
  onMarkerClick: (complex: Club) => void;
}

export const ComplexesMap: React.FC<ComplexesMapProps> = ({ complexes, onMarkerClick }) => {
  const complexesWithCoords = complexes.filter(
    (c): c is Club & { latitude: number; longitude: number; } =>
      c.latitude != null && c.longitude != null
  );

  if (complexesWithCoords.length === 0) {
    return (
      <div className="h-full w-full bg-[#f8f9f9] border-gray-200 rounded-2xl flex items-center justify-center text-center p-4">
        <p className="text-paragraph">Ningún complejo tiene una ubicación definida para mostrar en el mapa.</p>
      </div>
    );
  }

  // Calculamos el centro del mapa promediando las coordenadas
  const centerLat = complexesWithCoords.reduce((sum, c) => sum + c.latitude, 0) / complexesWithCoords.length;
  const centerLng = complexesWithCoords.reduce((sum, c) => sum + c.longitude, 0) / complexesWithCoords.length;

  return (
    <div className="h-[60vh] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0">
        <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        >
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {complexesWithCoords.map(complex => (
            <Marker
                key={complex.id}
                position={[complex.latitude, complex.longitude]}
                eventHandlers={{
                    click: () => onMarkerClick(complex),
                }}
            >
            <Popup>
                <div className="font-sans">
                <h4 className="font-bold text-md mb-1">{complex.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{complex.address}</p>
                <a href={`/canchas/${complex.slug}`} className="text-brand-orange font-semibold text-sm hover:underline">
                    Ver complejo
                </a>
                </div>
            </Popup>
            </Marker>
        ))}
        </MapContainer>
    </div>
  );
};