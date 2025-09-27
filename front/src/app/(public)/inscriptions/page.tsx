import React, { Suspense } from "react";
import { InscriptionsForm } from "@/app/features/public/components/InscriptionForm";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import { Spinner } from "@/shared/components/ui/Spinner";

const InscriptionsPageContent = () => {
  return <InscriptionsForm />;
};

export default function InscriptionsPage() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="py-20">
        <Suspense
          fallback={
            <div>
              <Spinner />
            </div>
          }
        >
          <InscriptionsPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
