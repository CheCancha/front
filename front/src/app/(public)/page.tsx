import Footer from "@/shared/components/Footer";
import HeroSection from "@/app/features/public/components/home/HeroSection";
import Navbar from "@/shared/components/Navbar";
import { BookingSection } from "../features/public/components/home/BookingSection";
import { KeyFeatures } from "../features/public/components/home/KeyFeatures";
import { FaqSection } from "../features/public/components/home/FaqSection";
import { CTAManagerSection } from "../features/public/components/home/CTAManagerSection";
import { CTASection } from "../features/public/components/home/CTASection";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <KeyFeatures />
      <BookingSection />
      <CTAManagerSection />
      <FaqSection />
      <CTASection />
      <Footer />
    </div>
  );
}
