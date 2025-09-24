import React from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import {  FullComplexData } from '@/shared/entities/complex/types';
import { NewCourt } from '@/shared/entities/complex/types';
import { Sport } from '@prisma/client';
import { CourtFormRow } from '@/shared/entities/court/ui/CourtRowForm';

interface Props {
  data: FullComplexData;
  originalData: FullComplexData | null;
  allSports: Sport[];
  newCourts: NewCourt[];
  courtsToDelete: string[];
  // Handlers para canchas
  onCourtChange: (id: string, field: string, value: string | number) => void;
  onAddNewCourt: () => void;
  onDeleteCourt: (id: string) => void;
  onRestoreCourt: (id: string) => void;
  onPriceRuleChange: (courtId: string, ruleId: string, field: string, value: number) => void;
  onAddPriceRule: (courtId: string) => void;
  onRemovePriceRule: (courtId: string, ruleId: string) => void;
}

export const CourtsManager = ({ data, originalData, allSports, newCourts, courtsToDelete, onCourtChange, onAddNewCourt, onDeleteCourt, onRestoreCourt, onPriceRuleChange, onAddPriceRule, onRemovePriceRule }: Props) => {
  
  const getDeletedCourtName = (courtId: string) => {
    return originalData?.courts.find(c => c.id === courtId)?.name || `Cancha (ID: ${courtId})`;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gestión de Canchas</h3>
        <button type="button" onClick={onAddNewCourt} className="inline-flex items-center px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Cancha
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Canchas existentes y nuevas */}
        {[...data.courts, ...newCourts].map(court => {
            const id = 'tempId' in court ? court.tempId : court.id;
            return (
                <CourtFormRow 
                    key={id} 
                    court={court} 
                    allSports={allSports} 
                    onCourtChange={onCourtChange}
                    onPriceRuleChange={onPriceRuleChange}
                    onAddPriceRule={onAddPriceRule}
                    onRemovePriceRule={onRemovePriceRule}
                    onDeleteCourt={onDeleteCourt}
                />
            )
        })}
      </div>

      {/* --- Canchas marcadas para eliminar --- */}
      {courtsToDelete.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                        Canchas a eliminar
                    </p>
                    <div className="mt-2 text-sm text-red-700">
                        <ul role="list" className="list-disc pl-5 space-y-1">
                            {courtsToDelete.map(courtId => (
                                <li key={courtId} className='flex justify-between items-center'>
                                    <span>{getDeletedCourtName(courtId)}</span>
                                    <button type="button" onClick={() => onRestoreCourt(courtId)} className="ml-4 text-xs font-semibold text-red-800 hover:underline">
                                        Restaurar
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3">Estas canchas se eliminarán permanentemente al guardar los cambios.</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};