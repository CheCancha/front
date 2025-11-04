"use client";

import { parseISO, format, startOfToday, endOfToday } from "date-fns";
import { AnalyticsFilters } from "@/app/features/dashboard/components/analytics/AnalyticsFilters";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { AnalyticsTab } from "@/app/features/dashboard/components/analytics/AnalyticsTab";
import { FinancialSummary } from "@/app/features/dashboard/components/financials/FinancialSummary";
import {
  PaymentMethod,
  TransactionSource,
  TransactionType,
} from "@prisma/client";
import toast from "react-hot-toast";
import { Dialog, DialogTrigger } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { PlusCircle } from "lucide-react";
import { NewExpenseModal } from "@/app/features/dashboard/components/financials/NewExpenseModal";

type Court = { id: string; name: string };

// --- COMPONENTE PRINCIPAL DE PÁGINA ---
export default function FinancialsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const complexId = params.complexId as string;
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LÓGICA DE FILTROS---
  const from = useMemo(() => {
    const fromParam = searchParams.get("from");
    return fromParam ? parseISO(fromParam) : startOfToday();
  }, [searchParams]);

  const to = useMemo(() => {
    const toParam = searchParams.get("to");
    return toParam ? parseISO(toParam) : endOfToday();
  }, [searchParams]);

  const courtIds = useMemo(() => {
    const courtIdsParam = searchParams.get("courtIds");
    return courtIdsParam ? courtIdsParam.split(",") : undefined;
  }, [searchParams]);

  const [availableCourts, setAvailableCourts] = useState<Court[]>([]);
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);

  useEffect(() => {
    if (!complexId) return;

    const fetchCourts = async () => {
      setIsLoadingCourts(true);
      try {
        const start = format(from, "yyyy-MM-dd");
        const end = format(to, "yyyy-MM-dd");
        const res = await fetch(
          `/api/complex/${complexId}/analytics?startDate=${start}&endDate=${end}`
        );
        if (!res.ok)
          throw new Error("No se pudieron cargar los filtros de cancha.");
        const data = await res.json();
        if (data.filters && Array.isArray(data.filters.availableCourts)) {
          setAvailableCourts(data.filters.availableCourts);
        } else {
          console.warn(
            "La API de Analytics no devolvió 'filters.availableCourts'"
          );
        }
      } catch (e) {
        toast.error("Error al cargar filtros de cancha.");
        console.error(e);
      } finally {
        setIsLoadingCourts(false);
      }
    };
    fetchCourts();
  }, [complexId, from, to]);

  // --- HANDLER DE GASTOS (Movido aquí) ---
  const handleAddExpense = useCallback(
    async (formData: {
      amount: number;
      description: string;
      source: TransactionSource;
      paymentMethod: PaymentMethod;
    }) => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/complex/${complexId}/financials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            type: TransactionType.EGRESO,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "No se pudo registrar el gasto.");
        }

        toast.success("Gasto registrado con éxito.");
        setIsExpenseModalOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [complexId, router]
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="analytics" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
            <TabsTrigger value="cashflow">Caja</TabsTrigger>   
          </TabsList>
          <Dialog
            open={isExpenseModalOpen}
            onOpenChange={setIsExpenseModalOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Registrar Gasto
              </Button>
            </DialogTrigger>
            <NewExpenseModal
              isOpen={isExpenseModalOpen}
              onClose={() => setIsExpenseModalOpen(false)}
              onSubmit={handleAddExpense}
              isSubmitting={isSubmitting}
            />
          </Dialog>
        </div>
        <AnalyticsFilters
          availableCourts={availableCourts}
          isLoading={isLoadingCourts}
        />

        {/* --- PESTAÑA 1: ANALÍTICAS --- */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab
            complexId={complexId}
            startDate={from}
            endDate={to}
            courtIds={courtIds}
          />
        </TabsContent>
        {/* --- PESTAÑA 2: CAJA --- */}
        <TabsContent value="cashflow" className="space-y-4">
          <FinancialSummary
            complexId={complexId}
            startDate={from}
            endDate={to}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
