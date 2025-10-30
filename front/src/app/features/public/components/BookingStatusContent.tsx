"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

type StatusType = "success" | "failure" | "pending" | "loading";

const statusConfig = {
  success: {
    id: "success",
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
    id: "failure",
    icon: <XCircle className="h-16 w-16 text-red-500" />,
    title: "Pago Rechazado",
    message:
      "No se pudo procesar tu pago. Por favor, intentá nuevamente con otro método de pago.",
    links: [{ href: "/canchas", text: "Volver a buscar" }],
  },
  pending: {
    id: "pending",
    icon: <Clock className="h-16 w-16 text-yellow-500" />,
    title: "Pago Pendiente",
    message:
      "Tu pago está siendo procesado. Recibirás una confirmación una vez que se apruebe. No es necesario que hagas nada más.",
    links: [
      { href: "/profile", text: "Ver estado de mis reservas" },
      { href: "/", text: "Volver al inicio" },
    ],
  },
  loading: {
    id: "loading",
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
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    let finalStatus: StatusType = "failure"; // Default a failure si el param es inválido

    if (statusParam === "success" || statusParam === "approved") {
      finalStatus = "success";
    } else if (statusParam === "failure") {
      finalStatus = "failure";
    } else if (statusParam === "pending") {
      finalStatus = "pending";
    }

    setStatus(finalStatus);
    setShowContent(true);
  }, [searchParams]);

  const currentStatus = statusConfig[status];

  return (
    <div className="flex flex-col items-center justify-center text-center pt-16 pb-12 px-4">
      <motion.div
        key={currentStatus.id}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: showContent ? 1 : 0.5, opacity: showContent ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      >
        {currentStatus.icon}
      </motion.div>

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
