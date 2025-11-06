import React from "react";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import { HeroClub } from "@/app/features/public/components/club/HeroClub";
import { ManagmentClub } from "@/app/features/public/components/club/ManagmentClub";
import { BannerCTA } from "@/app/features/public/components/club/BannerCTA";
import { WhyUsClub } from "@/app/features/public/components/club/WhyUsClub";
import { KeyFeatures } from "@/app/features/public/components/home/KeyFeatures";
import { PricingSection } from "@/app/features/public/components/club/PricingClub";

const Managment = () => {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <section>
        <HeroClub />
        <WhyUsClub />
        <ManagmentClub />
        <KeyFeatures />
        <PricingSection />
        <BannerCTA />
      </section>
      <Footer />
    </div>
  );
};

export default Managment;
