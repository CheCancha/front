import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <>
      <div className="bg-foreground text-background min-h-screen flex flex-col items-center justify-center text-center p-4">
        <Image
        src={'/notfound.jpg'}
        width={500}
        height={500}
        alt="no se encontr la pagina checancha" />
        <h1 className="text-7xl mt-2">404</h1>
        <h2 className=" mb-8">Página NO Encontrada</h2>
        <p className="mb-8">Lo sentimos, la página que estás buscando no existe o fue movida.</p>

        <Link href="/" className="text-brand-orange hover:underline transition-transform duration-300">
          Volver al Inicio
        </Link>
      </div>
    </>
  );
}
