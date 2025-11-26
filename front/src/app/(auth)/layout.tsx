import Footer from "@/shared/components/Footer";
import Navbar from "@/shared/components/Navbar";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
