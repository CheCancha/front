import React from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { FullComplexData, NewCourt } from "@/shared/entities/complex/types";
import { Sport, SubscriptionPlan } from "@prisma/client";
import { CourtFormRow } from "@/shared/entities/court/ui/CourtRowForm";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";

interface Props {
  data: FullComplexData;
  originalData: FullComplexData | null;
  allSports: Sport[];
  newCourts: NewCourt[];
  courtsToDelete: string[];
  subscriptionPlan: SubscriptionPlan;
  onCourtChange: (id: string, field: string, value: string | number) => void;
  onAddNewCourt: () => void;
  onDeleteCourt: (id: string) => void;
  onRestoreCourt: (id: string) => void;
  onPriceRuleChange: (
    courtId: string,
    ruleId: string,
    field: string,
    value: number
  ) => void;
  onAddPriceRule: (courtId: string) => void;
  onRemovePriceRule: (courtId: string, ruleId: string) => void;
}

export const CourtsManager = ({
  data,
  originalData,
  allSports,
  newCourts,
  courtsToDelete,
  subscriptionPlan,
  onCourtChange,
  onAddNewCourt,
  onDeleteCourt,
  onRestoreCourt,
  onPriceRuleChange,
  onAddPriceRule,
  onRemovePriceRule,
}: Props) => {
  const isBasicPlan = subscriptionPlan === 'BASE';
  const currentCourtCount = data.courts.length + newCourts.length;
  const isCourtLimitReached = isBasicPlan && currentCourtCount >= 3;

  const getDeletedCourtName = (courtId: string) => {
    return (
      originalData?.courts.find((c) => c.id === courtId)?.name ||
      `Cancha (ID: ${courtId})`
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-switzer font-semibold">Gestión de Canchas</h3>
        <div className="flex flex-col items-end">
          {/* El botón ahora se deshabilita condicionalmente */}
          <Button onClick={onAddNewCourt} disabled={isCourtLimitReached}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Cancha
          </Button>
          {/* Mensaje que aparece cuando se alcanza el límite */}
          {isCourtLimitReached && (
            <p className="text-xs text-yellow-600 mt-1 text-right">
              Límite de 3 canchas alcanzado. <Link href={`/dashboard/${data.id}/billing`} className="font-bold underline hover:text-yellow-700">Actualizá a Pro</Link>.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Canchas existentes y nuevas */}
        {[...data.courts, ...newCourts].map((court) => {
          const id = "tempId" in court ? court.tempId : court.id;
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
          );
        })}
      </div>

      {/* --- Canchas marcadas para eliminar --- */}
      {courtsToDelete.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Canchas a eliminar
              </p>
              <div className="mt-2 text-sm text-red-700">
                <ul role="list" className="list-disc pl-5 space-y-1">
                  {courtsToDelete.map((courtId) => (
                    <li
                      key={courtId}
                      className="flex justify-between items-center"
                    >
                      <span>{getDeletedCourtName(courtId)}</span>
                      <button
                        type="button"
                        onClick={() => onRestoreCourt(courtId)}
                        className="ml-4 text-xs font-semibold text-red-800 hover:underline"
                      >
                        Restaurar
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3">
                  Estas canchas se eliminarán permanentemente al guardar los
                  cambios.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
