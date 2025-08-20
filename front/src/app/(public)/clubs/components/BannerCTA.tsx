import React from "react";

export const BannerCTA = () => {
  return (
    <div className="bg-background w-full flex">
      <div className="border">
        <h2 className="font-lora text-3xl md:text-5xl font-semibold text-foreground">
          Elegi CheCancha y lleva tu negocio al siguiente nivel
        </h2>
        <p className="text-foreground text-lg">
          Las mejores herramientas para aumentar tus ventas y fidelizar a tus
          clientes.
        </p>
        <button >Contactanos ahora!</button>
      </div>
      <div className="border">
        [ACA VA UNA IMAGEN]
      </div>
    </div>
  );
};
