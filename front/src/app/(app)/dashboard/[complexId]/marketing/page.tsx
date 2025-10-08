import { authorizeAndVerify } from "@/shared/lib/authorize";
import QRCodeGenerator from "@/app/features/dashboard/components/marketing/QRCodeGenerator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { CouponsManager } from "@/app/features/dashboard/components/marketing/Coupons";

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ complexId: string }>;
}) {
  const { complexId } = await params;

  const { complex, error } = await authorizeAndVerify(complexId);
  if (error) {
    return <p>No tenés permiso para ver esta página.</p>;
  }

  return (
    <div className="space-y-6">
      <CouponsManager complexId={complex.id} />
      
      <Card>
        <CardHeader>
          <CardTitle>Pack Digital (Código QR)</CardTitle>
          <CardDescription>
            Generá un código QR para que tus clientes puedan acceder
            directamente a tu perfil de Che Cancha y reservar. Podés imprimirlo
            y pegarlo en tu complejo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QRCodeGenerator complexSlug={complex.slug} />
        </CardContent>
      </Card>

      {/* A futuro, aquí podrías agregar otras tarjetas para más herramientas de marketing */}
      
    </div>
  );
}
