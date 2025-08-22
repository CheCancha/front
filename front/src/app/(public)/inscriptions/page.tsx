import React, { Suspense } from 'react';
import { InscriptionsForm } from '@/app/features/landing/components/InscriptionForm';
import Navbar from '@/shared/components/Navbar';
import Footer from '@/shared/components/Footer';


const InscriptionsPageContent = () => {
  return <InscriptionsForm />;
};

export default function InscriptionsPage() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className='py-20'>
        <Suspense fallback={<div>Cargando...</div>}>
          <InscriptionsPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
