import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaTwitter, FaGithub } from "react-icons/fa";
import { routes } from "@/routes";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logochecancha.png"
                width={32}
                height={32}
                className="mr-3"
                alt="CheCancha Logo"
              />
              <span className="self-center text-2xl font-semibold whitespace-nowrap text-background">
                CheCancha
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            <div>
              <h2 className="mb-6 text-sm font-semibold uppercase text-background">
                Navegación
              </h2>
              <ul className="text-paragraph font-medium">
                <li className="mb-4">
                  <Link href={routes.public.canchas} className="hover:underline">
                    Canchas
                  </Link>
                </li>
                <li>
                  <Link href={routes.public.clubs} className="hover:underline">
                    Software
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold uppercase text-background">
                Seguinos
              </h2>
              <ul className="text-paragraph font-medium">
                <li className="mb-4">
                  <a href="#" className="hover:underline">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold uppercase text-background">
                Legal
              </h2>
              <ul className="text-paragraph font-medium">
                <li className="mb-4">
                  <Link href="#" className="hover:underline">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Términos &amp; Condiciones
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-paragraph sm:mx-auto lg:my-8" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-paragraph sm:text-center">
            © {new Date().getFullYear()}{" "}
            <Link href="/" className="hover:underline">
              CheCancha™
            </Link>
            . Todos los derechos reservados.
          </span>
          <div className="flex mt-4 sm:justify-center sm:mt-0 space-x-5">
            <a href="#" className="text-paragraph hover:text-white">
              <FaFacebook className="w-4 h-4" />
              <span className="sr-only">Página de Facebook</span>
            </a>
            <a href="#" className="text-paragraph hover:text-white">
              <FaInstagram className="w-4 h-4" />
              <span className="sr-only">Página de Instagram</span>
            </a>
            <a href="#" className="text-paragraph hover:text-white">
              <FaGithub className="w-4 h-4" />
              <span className="sr-only">Cuenta de GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
