import { NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { db } from "@/shared/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.complexId) {
      return new NextResponse("No autorizado o sin complejo asociado", {
        status: 401,
      });
    }

    const { planDetailsId, complexId } = await request.json();

    if (complexId !== session.user.complexId) {
      return new NextResponse("Acción no permitida", { status: 403 });
    }

    const planDetails = await db.subscriptionPlanDetails.findUnique({
      where: { id: planDetailsId },
    });

    if (!planDetails || !planDetails.mp_plan_id) {
      return new NextResponse("Plan no encontrado o mal configurado", {
        status: 404,
      });
    }

    const preapprovalClient = new PreApproval(client);

    const response = await preapprovalClient.create({
      body: {
        preapproval_plan_id: planDetails.mp_plan_id,
        reason: `Suscripción Che Cancha - ${planDetails.plan} ${planDetails.cycle}`,
        payer_email: session.user.email,
        back_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${complexId}/billing/success`,
        auto_recurring: {
          frequency: 1,
          frequency_type: planDetails.cycle === "MENSUAL" ? "months" : "years",
          transaction_amount: planDetails.price / 100,
          currency_id: "ARS",
        },
      },
    });

    if (!response?.id || !response?.init_point) {
      throw new Error("Mercado Pago no devolvió un ID o init_point válido.");
    }

    await db.complex.update({
      where: { id: complexId },
      data: {
        mp_subscription_id: response.id,
      },
    });

    return NextResponse.json({ init_point: response.init_point });
  } catch (error) {
    console.error("[SUBSCRIPTIONS_POST]", error);
    return new NextResponse("Error al crear la suscripción", { status: 500 });
  }
}