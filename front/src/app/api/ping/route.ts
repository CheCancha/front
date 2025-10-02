
import { NextResponse } from "next/server";

export async function GET() {
  console.log("Ping de Cron Job recibido para mantener la función 'warm'.");
  return new NextResponse("Pong!", { status: 200 });
}