"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { Complex } from "@prisma/client";
import { Img } from "@react-email/components";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";

interface MPButtonProps {
  complex: Complex;
}

const MercadoPagoConnectButton = ({ complexId }: { complexId: string }) => {
  const CLIENT_ID = process.env.NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/callback`;
  
  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${complexId}`;

  return (
    <a
      href={authUrl}
      className="inline-block w-full whitespace-nowrap rounded-lg bg-[#009EE3] py-2 px-4 text-center font-semibold text-white transition-colors hover:bg-[#0089cc] sm:w-auto"
    >
      Conectar con Mercado Pago
    </a>
  );
};

export default function MPButton({ complex }: MPButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isConnected = !!complex.mp_connected_at;

  const handleDisconnect = async () => {
    setIsLoading(true);
    toast.loading("Desconectando...");
    try {
      const response = await fetch(`/api/mercadopago/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complexId: complex.id }),
      });
      
      toast.dismiss();
      if (!response.ok) {
        throw new Error("No se pudo desconectar la cuenta.");
      }
      
      toast.success("Cuenta de Mercado Pago desconectada.");
      router.refresh();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Error desconocido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold leading-6 text-gray-900">
        Pagos y Cobranzas
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Conecta tu cuenta de Mercado Pago para aceptar señas y pagos online.
      </p>
      
      <div className="mt-6 flex flex-col items-start gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
        <Img
          src="https://logospng.org/download/mercado-pago/logo-mercado-pago-256.png"
          alt="Mercado Pago Logo"
          className="h-10 w-10 flex-shrink-0"
        />
        <div className="flex-1">
          {isConnected ? (
            <>
              <p className="font-medium text-green-600">Estado: Conectado</p>
              <p className="text-sm text-gray-500">
                Conectado el {new Date(complex.mp_connected_at!).toLocaleDateString()}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-red-600">Estado: No conectado</p>
              <p className="text-sm text-gray-500">
                Aún no puedes recibir pagos online.
              </p>
            </>
          )}
        </div>
        
        {isConnected ? (
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isLoading}
                className="w-full rounded-lg bg-gray-200 py-2 px-4 font-semibold text-gray-800 transition-colors hover:bg-gray-300 sm:w-auto disabled:opacity-50 cursor-pointer"
              >
                Desconectar
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Al desconectar tu cuenta, no podrás recibir pagos online a través de Che Cancha. Podrás volver a conectarla en cualquier momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                  Sí, desconectar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <MercadoPagoConnectButton complexId={complex.id} />
        )}
      </div>
    </div>
  );
}