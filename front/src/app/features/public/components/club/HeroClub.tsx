"use client";

import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { routes } from "@/routes";

export const HeroClub = () => {
  return (
    <main>
      <div
        aria-hidden
        className="absolute inset-0 z-0 isolate hidden opacity-50 contain-strict lg:block"
      >
        <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>

      <section className="overflow-hidden bg-muted/50 dark:bg-background">
        <div className="relative mx-auto max-w-5xl px-6 pt-28 lg:pt-32">
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-semibold md:text-5xl lg:text-6xl font-lora">
              Automatiza tus reservas y maximiza tus ingresos.
            </h1>
            <p className="text-muted-foreground mx-auto my-8 max-w-2xl text-xl font-satoshi">
              CheCancha es la plataforma todo en uno que simplifica la gestión
              de tu complejo deportivo. Menos administración, más crecimiento.
            </p>

            {/* 2. Botón CTA  */}
            <Button asChild size="lg">
              <Link href={routes.public.inscripciones}>
                <span>Comenzá ahora</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto 2xl:max-w-7xl">
          <div className="perspective-distant pl-8 lg:pl-44">
            <div className="lg:h-176 rotate-x-20 mask-b-from-55% mask-b-to-100% mask-r-from-75% skew-x-12 pl-6 pt-6">
              <Image
                className="rounded-lg border shadow-xl"
                src="/charts.png"
                alt="Dashboard de administración de CheCancha"
                width={2880}
                height={2074}
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

//