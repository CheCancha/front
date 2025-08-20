import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import React from "react";
import { HeroClub } from "./components/HeroClub";
import { ManagmentClub } from "./components/ManagmentClub";
import { DataClub } from "./components/DataClub";
import { BannerCTA } from "./components/BannerCTA";

const Managment = () => {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <section>
        <HeroClub />
        <ManagmentClub />
        <DataClub />
        <BannerCTA />

        <div>
          <h2>secciones opciones:</h2>
          <ol>
            <li>Banner: digitaliza o automatiza tu complejo: facil y rapido, multiplataforma, 100% online</li>
            <li>Conoce los recursos y funcionalidades destacadas</li>
            <li>Porque nos eligen nuestros usuarios: 1. Simpleza y automatizacion 2. Reduccion de inasistencias 3. cobra por adelantado 4. Recordatorios automaticos</li>
            <li>Control total de tu negocio y 7 items</li>
          </ol>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Managment;
