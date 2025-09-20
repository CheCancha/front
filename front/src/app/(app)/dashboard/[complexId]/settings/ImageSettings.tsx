"use client";

import React, { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Upload, X, Star } from "lucide-react";
import { Spinner } from "@/shared/components/ui/Spinner";
import type { Image } from "@prisma/client";
import type { FullComplexData } from "@/app/(app)/dashboard/[complexId]/settings/page";


interface ImageSettingsProps {
  data: FullComplexData;
  setData: React.Dispatch<React.SetStateAction<FullComplexData | null>>;
  complexId: string;
}

export default function ImageSettings({
  data,
  setData,
  complexId,
}: ImageSettingsProps) {
  const [isUploading, setIsUploading] = useState(false);

  const { primaryImage, otherImages } = useMemo(() => {
    const primary = data.images.find((img) => img.isPrimary);
    const others = data.images.filter((img) => !img.isPrimary);
    return { primaryImage: primary, otherImages: others };
  }, [data.images]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    toast.loading("Subiendo imágenes...");

    const uploadPromises = Array.from(files).map((file) => {
      const formData = new FormData();
      formData.append("file", file);
      return fetch(`/api/complex/${complexId}/upload-image`, {
        method: "POST",
        body: formData,
      });
    });

    try {
      const results = await Promise.allSettled(uploadPromises);
      const newImages: Image[] = [];
      let successfulUploads = 0;
      let failedUploads = 0;

      for (const result of results) {
        if (result.status === "fulfilled" && result.value.ok) {
          newImages.push(await result.value.json());
          successfulUploads++;
        } else {
          failedUploads++;
        }
      }

      if (newImages.length > 0) {
        setData((prev) => {
          if (!prev) return null;
          const isFirstUpload = prev.images.length === 0;
          const processedNewImages = newImages.map((img, index) => ({
            ...img,
            isPrimary: isFirstUpload && index === 0,
          }));
          return { ...prev, images: [...prev.images, ...processedNewImages] };
        });
      }

      toast.dismiss();
      if (successfulUploads > 0)
        toast.success(`${successfulUploads} imagen(es) subida(s) con éxito.`);
      if (failedUploads > 0)
        toast.error(`${failedUploads} imagen(es) no pudieron subirse.`);
    } catch (error) {
      toast.dismiss();
      toast.error("Ocurrió un error inesperado al subir las imágenes.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async (imageId: string) => {
    const originalImages = data.images;
    const imageToRemove = originalImages.find((img) => img.id === imageId);

    setData((prev) => {
      if (!prev) return null;
      const newImages = prev.images.filter((img) => img.id !== imageId);
      if (imageToRemove?.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });

    try {
      const response = await fetch(
        `/api/complex/${complexId}/image/${imageId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Fallo en la API");
      toast.success("Imagen eliminada permanentemente.");
    } catch (error) {
      toast.error("No se pudo eliminar la imagen. Se restaurará.");
      setData((prev) => (prev ? { ...prev, images: originalImages } : null));
    }
  };

  const setPrimaryImage = (imageId: string) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        images: prev.images.map((img) => ({
          ...img,
          isPrimary: img.id === imageId,
        })),
      };
    });
    toast.success(
      "Imagen de portada actualizada. Guarda los cambios para hacerlo permanente."
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold leading-6 text-gray-900">
          Imagen de Portada
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Esta es la imagen principal que verán los usuarios al buscar tu
          complejo.
        </p>
        <div className="mt-4 w-full h-64 rounded-lg bg-gray-200 flex items-center justify-center border">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt="Imagen de portada"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-gray-500">
              No hay una imagen de portada seleccionada
            </span>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold leading-6 text-gray-900">
          Galería de Imágenes
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Añade más fotos para mostrar tus instalaciones.
        </p>
        <div
          className={`mt-4 border-2 border-dashed border-gray-300 rounded-lg p-6 ${
            isUploading ? "bg-gray-50" : ""
          }`}
        >
          <div className="text-center">
            {isUploading ? (
              <Spinner />
            ) : (
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <div className="mt-4">
              <label
                htmlFor="file-upload"
                className={`cursor-pointer ${
                  isUploading ? "cursor-not-allowed text-gray-500" : ""
                }`}
              >
                <span className="mt-2 block text-sm font-medium text-gray-900 hover:text-blue-600">
                  {isUploading ? "Subiendo..." : "Seleccionar imágenes"}
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF hasta 10MB cada una
              </p>
            </div>
          </div>
        </div>
        {otherImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {otherImages.map((image) => (
              <div key={image.id} className="relative group aspect-square">
                <img
                  src={image.url}
                  alt="Imagen del complejo"
                  className="w-full h-full object-cover rounded-lg bg-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(image.id)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Marcar como portada"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar imagen"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {data.images.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No hay imágenes cargadas aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
