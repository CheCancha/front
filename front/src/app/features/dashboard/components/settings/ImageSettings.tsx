"use client";

import React, { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Upload, Star, Image as ImageIcon, Trash2, RotateCcw } from "lucide-react";
import type { Image } from "@prisma/client";
import { FullComplexData } from "@/shared/entities/complex/types";

// Componente Spinner local para evitar problemas de importación.
const Spinner = () => (
  <svg className="animate-spin h-8 w-8 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// --- Props actualizados para recibir todo del padre ---
interface ImageSettingsProps {
  data: FullComplexData;
  setData: React.Dispatch<React.SetStateAction<FullComplexData | null>>;
  complexId: string;
  originalData: FullComplexData;
  imagesToDelete: string[];
  onDeleteImage: (imageId: string) => void;
  onRestoreImage: (imageId: string) => void;
}

export default function ImageSettings({
  data,
  setData,
  complexId,
  originalData,
  imagesToDelete,
  onDeleteImage,
  onRestoreImage,
}: ImageSettingsProps) {
  const [isUploading, setIsUploading] = useState(false);

  const primaryImage = useMemo(
    () => data.images.find((img) => img.isPrimary),
    [data.images]
  );
  
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!complexId) {
        toast.error("No se pudo identificar el complejo. Refresca la página.");
        return;
    }

    setIsUploading(true);
    toast.loading("Subiendo imágenes...");
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`/api/complex/${complexId}/upload-image`, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error(`Fallo al subir ${file.name}`);
        return response.json() as Promise<Image>;
      });

      const newImages = await Promise.all(uploadPromises);

      setData((prev) => {
        if (!prev) return null;
        const allImages = [...prev.images, ...newImages];
        const hasPrimary = allImages.some((img) => img.isPrimary);
        if (!hasPrimary && allImages.length > 0) {
          allImages[0].isPrimary = true;
        }
        return { ...prev, images: allImages };
      });
      toast.dismiss();
      toast.success(`${newImages.length} imagen(es) subida(s).`);
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Ocurrió un error al subir.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const setPrimaryImage = (imageId: string) => {
    setData((prev) => {
      if (!prev) return null;
      const newImages = prev.images.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }));
      return { ...prev, images: newImages };
    });
    toast.success("Imagen de portada actualizada. Recuerda guardar los cambios.");
  };

  const imagesMarkedForDeletion = useMemo(() => {
    return originalData.images.filter(img => imagesToDelete.includes(img.id));
  }, [originalData.images, imagesToDelete]);


  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Imagen de Portada</h3>
        <div className="mt-4 w-full aspect-[16/7] relative rounded-lg bg-gray-100 flex items-center justify-center border overflow-hidden">
          {primaryImage ? (
            <img src={primaryImage.url} alt="Imagen de portada" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="text-center text-gray-500"><ImageIcon className="mx-auto h-12 w-12" /><span>No hay imagen de portada</span></div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Galería de Imágenes</h3>
        <p className="text-sm text-gray-500 mt-1">Gestiona todas las fotos de tu complejo.</p>

        <div className="mt-4">
          {data.images.length > 0 ? (
            <ul className="space-y-3">
              {data.images.map((image) => (
                <li key={image.id} className="flex items-center gap-4 bg-white p-2 border rounded-lg shadow-sm">
                  <div className="w-16 h-16 relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={image.url} alt="Miniatura" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow text-sm text-gray-600 truncate" title={image.url}>{image.url.split("/").pop()}</div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setPrimaryImage(image.id)} disabled={image.isPrimary} title="Marcar como portada"
                      className={`p-2 rounded-full transition-colors cursor-pointer ${image.isPrimary ? "bg-amber-400 text-white cursor-default" : "bg-gray-200 hover:bg-amber-400 hover:text-white"}`}>
                      <Star className="w-5 h-5" />
                    </button>
                    {/* El botón de eliminar ahora llama a la función del padre */}
                    <button type="button" onClick={() => onDeleteImage(image.id)} title="Eliminar imagen"
                      className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition-colors cursor-pointer">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg mt-4"><p>No hay imágenes en la galería.</p></div>
          )}
        </div>
        
        {imagesMarkedForDeletion.length > 0 && (
          <div className="mt-6">
             <h4 className="text-md font-semibold text-gray-800">Imágenes a eliminar</h4>
             <p className="text-sm text-gray-500 mt-1">Estas imágenes se eliminarán permanentemente cuando guardes los cambios.</p>
             <ul className="space-y-3 mt-3">
              {imagesMarkedForDeletion.map((image) => (
                <li key={image.id} className="flex items-center gap-4 bg-red-50 p-2 border border-red-200 rounded-lg shadow-sm">
                  <div className="w-16 h-16 relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0 opacity-60">
                    <img src={image.url} alt="Miniatura a eliminar" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow text-sm text-red-700 truncate" title={image.url}>{image.url.split("/").pop()}</div>
                  <button type="button" onClick={() => onRestoreImage(image.id)} title="Restaurar imagen"
                      className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                      <RotateCcw className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`mt-6 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isUploading ? "bg-gray-50" : "hover:border-gray-400"}`}>
          {isUploading ? (
            <div className="flex flex-col items-center gap-2"><Spinner /><span>Subiendo...</span></div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="file-upload" className="mt-2 block text-sm font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                Seleccionar imágenes
                <input id="file-upload" name="file-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploading} />
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}