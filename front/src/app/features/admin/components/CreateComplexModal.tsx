"use client";

import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/shared/components/ui/dialog";
import { QuickCreateComplexForm } from "./QuickCreateComplexForm";

interface CreateComplexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; 
}

export const CreateComplexModal: React.FC<CreateComplexModalProps> = ({ isOpen, onClose, onSuccess }) => {

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    onClose(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Complejo (Onboarding Asistido)</DialogTitle>
          <DialogDescription>
            Completa los datos mínimos para crear la cuenta. El manager recibirá un email para configurar su contraseña.
          </DialogDescription>
        </DialogHeader>
        
        {/* Usamos el formulario existente dentro del modal */}
        <div className="pt-4">
            <QuickCreateComplexForm onSuccess={handleSuccess} />
        </div>

      </DialogContent>
    </Dialog>
  );
};