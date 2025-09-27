import React, { Suspense } from "react";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import BookingStatusContent from '@/app/features/public/components/BookingStatusContent';
import { Clock } from "lucide-react";

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center text-center">
    <Clock className="h-16 w-16 text-gray-400 animate-spin" />
    <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
      Verificando estado del pago...
    </h1>
    <p className="mt-2 text-base text-paragraph">
      Por favor, aguardá un momento.
    </p>
  </div>
);

export default function BookingStatusPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4">
        <Suspense fallback={<LoadingFallback />}>
          <BookingStatusContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
