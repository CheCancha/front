"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Club } from "@/app/(public)/canchas/page";
import Link from "next/link";
import { routes } from "@/routes";
import "leaflet-gesture-handling";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";

const orangeIcon = new L.DivIcon({
  className: "",
  html: `<svg viewBox="0 0 24 24" width="36" height="48" fill="#F97316" xmlns="http://www.w3.org/2000/svg">
           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
         </svg>`,
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -44],
});

interface ComplexesMapProps {
  complexes: Club[];
}

declare module "react-leaflet" {
  interface MapContainerProps {
    gestureHandling?: boolean;
  }
}

interface ComplexesMapProps {
  complexes: Club[];
}

function ResizeHandler() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [map]);

  return null;
}

export const ComplexesMap: React.FC<ComplexesMapProps> = ({ complexes }) => {
  const validComplexes = complexes.filter((c) => c.latitude && c.longitude);

  const defaultPosition: [number, number] = [
    -29.229851180174972, -61.76999518939678,
  ];

  const mapCenter: L.LatLngTuple =
    validComplexes.length > 0
      ? [validComplexes[0].latitude!, validComplexes[0].longitude!]
      : defaultPosition;

  return (
    <MapContainer
      center={mapCenter}
      zoom={12}
      gestureHandling={true}
      style={{ height: "65vh", width: "100%", borderRadius: "1rem" }}
    >
      <ResizeHandler />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {validComplexes.map((club) => (
        <Marker
          key={club.id}
          position={[club.latitude!, club.longitude!]}
          icon={orangeIcon}
        >
          <Popup>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <span style={{ fontWeight: "bold" }}>{club.name}</span>
              <span style={{ fontSize: "0.875rem" }}>{club.address}</span>
              <Link
                href={routes.public.complexProfile(club.slug)}
                className="!text-orange-500 font-semibold hover:!text-orange-600 hover:underline mt-1"
              >
                Ir al club
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
