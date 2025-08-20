import Footer from "@/shared/components/Footer";
import HeroSection from "@/app/(public)/components/HeroSection";
import Navbar from "@/shared/components/Navbar";
import { BookingSection } from "./components/BookingSection";
import { KeyFeatures } from "./components/KeyFeatures";
import { FaqSection } from "./components/FaqSection";
import { CTASection } from "./components/CTASection";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <KeyFeatures />
      <BookingSection />
      <FaqSection />
      <CTASection />

      <Footer />
    </div>
  );
}
