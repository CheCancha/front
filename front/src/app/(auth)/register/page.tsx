import { RegisterForm } from "@/app/features/auth/components/AuthForms";
import Footer from "@/shared/components/Footer";
import Navbar from "@/shared/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="flex py-8 justify-center items-center ">
        <div className="relative w-full max-w-md bg-bg-complementario p-6 rounded-lg border border-assets shadow-sm">
          <div className="flex justify-center mb-2">
            <Link href="/">
              <Image
                src="/logochecancha.png"
                alt="Logo del CheCancha"
                height={80}
                width={80}
                className="rounded-md object-cover"
              />
            </Link>
          </div>

          <RegisterForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
