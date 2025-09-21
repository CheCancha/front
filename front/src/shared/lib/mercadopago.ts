import { MercadoPagoConfig, Preference } from "mercadopago";

export const getMercadoPagoPreferenceClient = (accessToken: string) => {

  const client = new MercadoPagoConfig({ accessToken });

  return new Preference(client);
};
