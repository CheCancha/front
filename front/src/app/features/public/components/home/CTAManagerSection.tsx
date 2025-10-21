"use client";

import { routes } from "@/routes";
import Image from "next/image";
import Link from "next/link";

export function CTAManagerSection() {
  return (
    <>
      <div className="mx-auto max-w-7xl md:py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="relative isolate overflow-hidden bg-brand-dark px-6 pt-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
          <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -z-10 size-256 -translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
          >
            <circle
              r={512}
              cx={512}
              cy={512}
              fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
              fillOpacity="0.7"
            />
            <defs>
              <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                {/* brand-orange */}
                <stop stopColor="#eafae9" />
                <stop offset={1} stopColor="#c0f2c0" />
              </radialGradient>
            </defs>
          </svg>
          <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
            <h2 className="text-3xl font-switzer font-semibold tracking-tight text-balance text-white sm:text-4xl">
              ¿Tenés un complejo deportivo? Potenciá tu negocio.
            </h2>
            <p className="mt-6 text-lg/8 text-pretty text-gray-300">
              Optimizá tu gestión, llená horarios vacíos y conectá con miles de
              nuevos jugadores. Somos tu aliado digital para crecer.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              <Link
                href={routes.public.inscripciones}
                className="rounded-md bg-brand-orange px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Comenzar Ahora
              </Link>
              <Link
                href={routes.public.clubs}
                className="text-sm/6 font-semibold text-white hover:text-gray-100"
              >
                Ver más{' '} 
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="relative mt-16 h-80 lg:mt-8">
            <Image
              alt="dashboar de che cancha"
              src="/dashboarda.png"
              width={1824}
              height={1080}
              className="absolute top-0 left-0 w-228 max-w-none rounded-md bg-white/5 ring-1 ring-white/10"
            />
          </div>
        </div>
      </div>
    </>
  );
}
