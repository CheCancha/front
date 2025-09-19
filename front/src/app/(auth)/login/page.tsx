"use client";

import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/app/features/auth/components/AuthForms";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";

export default function LoginPage() {
  return (
    <>
    <Navbar />
      <main className="flex py-8 justify-center items-center">
        <div className="relative w-full max-w-md bg-bg-complementario p-6 rounded-xl border border-assets shadow-sm">
          <div className="flex justify-center mb-2">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Logo del CheCancha"
                height={80}
                width={80}
                className="rounded-full object-cover"
              />
            </Link>
          </div>

          <LoginForm />
        </div>
      </main>
      <Footer/>
    </>
  );
}
