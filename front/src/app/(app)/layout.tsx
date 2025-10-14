import Footer from "@/shared/components/Footer";
import Navbar from "@/shared/components/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <main className="max-w-7xl mx-auto pt-24 pb-16 px-4 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
