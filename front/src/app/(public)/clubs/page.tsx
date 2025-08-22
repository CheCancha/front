import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";
import React from "react";
import { HeroClub } from "../../features/landing/components/club/HeroClub";
import { ManagmentClub } from "../../features/landing/components/club/ManagmentClub";
import { BannerCTA } from "../../features/landing/components/club/BannerCTA";
import { WhyUsClub } from "../../features/landing/components/club/WhyUsClub";
import { KeyFeatures } from "../../features/landing/components/home/KeyFeatures";
import { PricingSection } from "../../features/landing/components/club/PricingClub";

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
