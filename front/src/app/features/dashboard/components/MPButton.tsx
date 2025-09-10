"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { ButtonGhost, ButtonSecondary } from "@/shared/components/ui/Buttons";
// import { Spinner } from "@/shared/components/ui/Spinner";

const MercadoPagoConnectButton = () => {
  const CLIENT_ID = process.env.NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID;
  
  const redirectUri = "/api/mercado-pago/callback";
  
  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}${redirectUri}`;

  return (
    <a 
      href={authUrl} 
      className="bg-[#009EE3] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#0089cc] transition-colors"
    >
      Conectar con Mercado Pago
    </a>
  );
};


export default function MPButton () {
  const { data: session, status } = useSession();

  // Aquí deberías hacer un fetch para obtener los datos de la institución/complejo del usuario logueado
  // y verificar si ya tiene un `mp_access_token`. Por ahora, lo simulamos.
  // const { data: complejo, isLoading } = useQuery(['complejo', session?.user?.id], fetchComplejoData);
  const isConnected = false; // TODO: Reemplazar con el estado real de la base de datos
  const isLoading = status === 'loading';

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg">
        {/* <Spinner /> */}
        cargando...
        <p className="text-gray-500">Cargando configuración de pagos...</p>
      </div>
    );
  }

  return (
    <div className="pt-8">
      <h3 className="text-lg font-semibold leading-6 text-gray-900">Pagos y Cobranzas</h3>
      <p className="mt-1 text-sm text-gray-500">Conecta tu cuenta de Mercado Pago para aceptar señas y pagos online.</p>
      <div className="mt-6">
        <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg">
          <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-256.png" alt="Mercado Pago Logo" className="h-10"/>
          <div className="flex-1">
            {isConnected ? (
              <>
                <p className="font-medium text-green-600">Estado: Conectado</p>
                <p className="text-sm text-gray-500">Ya puedes recibir pagos online a través de Checancha.</p>
              </>
            ) : (
              <>
                <p className="font-medium text-red-600">Estado: No conectado</p>
                <p className="text-sm text-gray-500">Aún no puedes recibir pagos online.</p>
              </>
            )}
          </div>
          {isConnected ? (
             <ButtonGhost >Desconectar</ButtonGhost>
          ) : (
            <MercadoPagoConnectButton />
          )}
        </div>
      </div>
    </div>
  );
}
