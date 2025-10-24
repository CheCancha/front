"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type StatusType = "success" | "failure" | "pending" | "loading";

const statusConfig = {
  success: {
    icon: <CheckCircle className="h-16 w-16 text-green-500" />,
    title: "¡Reserva Confirmada!",
    message:
      "Tu pago fue procesado exitosamente y tu turno ha sido agendado. ¡Gracias por tu reserva!",
    links: [
      { href: "/profile", text: "Ver mis reservas" },
      { href: "/canchas", text: "Buscar otra cancha" },
    ],
  },
  failure: {
    icon: <XCircle className="h-16 w-16 text-red-500" />,
    title: "Pago Rechazado",
    message:
      "No se pudo procesar tu pago. Por favor, intentá nuevamente con otro método de pago.",
    links: [
      { href: "/canchas", text: "Volver a buscar" },
    ],
  },
  pending: {
    icon: <Clock className="h-16 w-16 text-yellow-500" />,
    title: "Pago Pendiente",
    message:
      "Tu pago está siendo procesado. Recibirás una confirmación una vez que se apruebe. No es necesario que hagas nada más.",
    links: [
      { href: "/profile/bookings", text: "Ver estado de mis reservas" },
      { href: "/", text: "Volver al inicio" },
    ],
  },
  loading: {
    icon: <Clock className="h-16 w-16 text-gray-400 animate-spin" />,
    title: "Verificando estado...",
    message:
      "Por favor, aguardá un momento mientras procesamos la información de tu pago.",
    links: [],
  },
};

export default function BookingStatusContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StatusType>("loading");

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "success" || statusParam === "approved") {
      setStatus("success");
    } else if (statusParam === "failure") {
      setStatus("failure");
    } else if (statusParam === "pending") {
      setStatus("pending");
    } else {
      setStatus("failure");
    }
  }, [searchParams]);

  const currentStatus = statusConfig[status];

  return (
    <div className="flex flex-col items-center justify-center text-center pt-24 pb-12">
      {currentStatus.icon}
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
        {currentStatus.title}
      </h1>
      <p className="mt-2 text-base text-paragraph max-w-md">
        {currentStatus.message}
      </p>
      <div className="mt-8 flex items-center gap-x-4">
        {currentStatus.links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md bg-brand-orange px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {link.text}
          </Link>
        ))}
      </div>
    </div>
  );
}
