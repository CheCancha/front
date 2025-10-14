import React from "react";
import { AmenityIcon } from "@/shared/components/ui/AmenityIcon";

type Amenity = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
};

interface Props {
  allAmenities: Amenity[];
  selectedAmenities: string[];
  onAmenityChange: (amenityId: string, isSelected: boolean) => void;
}

export const AmenitiesForm = ({
  allAmenities,
  selectedAmenities,
  onAmenityChange,
}: Props) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold leading-6 text-brand-dark">
        Comodidades y Servicios
      </h3>
      <p className="text-sm text-gray-500">
        Selecciona todos los servicios que ofrece tu complejo. Esto ayudará a
        los jugadores a encontrarte.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allAmenities.map((amenity) => {
          const isSelected = selectedAmenities.includes(amenity.id);
          return (
            <div key={amenity.id} className="flex items-center gap-2">
              <input
                id={`amenity-${amenity.id}`}
                name="amenities"
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onAmenityChange(amenity.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <AmenityIcon
                iconName={amenity.icon}
                className="h-4 w-4 text-gray-600"
              />
              <label
                htmlFor={`amenity-${amenity.id}`}
                className="block text-sm text-brand-dark"
              >
                {amenity.name}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
