import { MercadoPagoConfig, Preference } from "mercadopago";
import SimpleCrypto from "simple-crypto-js";


export const getMercadoPagoPreferenceClient = (encryptedAccessToken: string) => {
  const secretKey = process.env.ENCRYPTION_KEY!;
  const crypto = new SimpleCrypto(secretKey);
  
  const accessToken = crypto.decrypt(encryptedAccessToken) as string;

  const client = new MercadoPagoConfig({ accessToken });

  return new Preference(client);
};

