"use client";

import React from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { Complex } from "@prisma/client";
import Image from "next/image";

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
  const isConnected = !!complex.mp_connected_at;

  const handleDisconnect = async () => {
    const confirmation = window.confirm("¿Estás seguro de que quieres desconectar tu cuenta de Mercado Pago? No podrás recibir pagos online.");
    if (!confirmation) return;

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
        <Image
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
          <button 
            onClick={handleDisconnect} 
            className="w-full rounded-lg bg-gray-200 py-2 px-4 font-semibold text-gray-800 transition-colors hover:bg-gray-300 sm:w-auto"
          >
            Desconectar
          </button>
        ) : (
          <MercadoPagoConnectButton complexId={complex.id} />
        )}
      </div>
    </div>
  );
}