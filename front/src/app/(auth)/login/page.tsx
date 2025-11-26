"use client";

import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/app/features/auth/components/AuthForms";
import Navbar from "@/shared/components/Navbar";
import Footer from "@/shared/components/Footer";

export default function LoginPage() {
  return (
    <>
      <main className="flex py-24 justify-center min-h-[80dvh]">
        <div className="relative w-full max-w-md bg-bg-complementario p-6 rounded-xl border border-assets shadow-sm">
          <div className="flex justify-center mb-2">
            <Link href="/">
              <Image
                src="/checanchalogo.png"
                alt="Logo del CheCancha"
                height={60}
                width={60}
                className="rounded-md object-cover"
              />
            </Link>
          </div>

          <LoginForm />
        </div>
      </main>
    </>
  );
}
