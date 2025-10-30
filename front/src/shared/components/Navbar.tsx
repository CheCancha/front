"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { routes } from "@/routes";
import { useSession, signOut } from "next-auth/react";
import {
  UserCircle,
  Search,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  Trophy,
  CircleQuestionMark,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "@/shared/lib/utils";
import { NotificationBell } from "./NotificationBell";

// Definición de enlaces de Redes Sociales (ajusta los URLs reales de Che Cancha)
const socialLinks = [
  {
    icon: FaInstagram,
    href: "https://www.instagram.com/checancha",
    label: "Instagram",
  },
  {
    icon: FaFacebook,
    href: "https://www.facebook.com/che_cancha",
    label: "Facebook",
  },
  {
    icon: FaYoutube,
    href: "https://youtube.com/@checancha?si=qETNXWSq9-_r56Kh",
    label: "YouTube",
  },
];

const NavbarSkeleton: React.FC = () => (
  <nav className="bg-background border-b sticky top-0 z-50 animate-pulse">
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-9 w-28 bg-gray-200 rounded-md" />
        </div>
        <div className="flex md:hidden">
          <div className="h-8 w-8 bg-gray-200 rounded-md" />
        </div>
      </div>
    </div>
  </nav>
);

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 2. Usar el hook para saber la ruta actual
  const pathname = usePathname();
  const isHomePage = pathname === routes.public.home;

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
      setIsDesktopMenuOpen(false);
      setIsMobileMenuOpen(false);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAuthLoading = status === "loading";

  // Determinar si la barra debe ser transparente
  const isTransparent = isHomePage && !scrolled && !isMobile;

  const getDashboardUrl = () => {
    if (!user) return routes.public.home;
    switch (user.role) {
      case "ADMIN":
        return "/admin";
      case "MANAGER":
        return user.complexId
          ? routes.app.dashboard(user.complexId)
          : "/dashboard/create-complex";
      case "USER":
        return routes.app.perfil;
      default:
        return routes.public.home;
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDesktopMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  if (isAuthLoading) {
    return <NavbarSkeleton />;
  }

  return (
    <motion.nav
      variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      // 3. Aplicar estilos basados en si es transparente o no
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isTransparent
          ? "bg-transparent border-transparent"
          : "bg-background border-b"
      )}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href={routes.public.home} className="flex items-center gap-2">
              <Image
                src="/checanchalogo.png"
                alt="Logo de Che Cancha"
                height={40}
                width={40}
                className="rounded-md overflow-hidden"
              />
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <Link
                    href={routes.public.canchas}
                    className={cn(
                      "flex items-center gap-2 font-medium py-2 px-4 rounded-md transition duration-300",
                      isTransparent
                        ? "text-white hover:bg-white/10"
                        : "text-brand-dark hover:bg-gray-100"
                    )}
                  >
                    <Search size={16} />
                    Buscar Cancha
                  </Link>

                  <div className="flex items-center gap-2">
                    <NotificationBell isTransparent={isTransparent} />
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md p-2 transition-colors cursor-pointer",
                          isTransparent
                            ? "text-white hover:bg-white/10"
                            : "text-brand-dark hover:bg-gray-100"
                        )}
                      >
                        <span
                          className={cn(
                            "font-medium transition-colors",
                            isTransparent ? "text-white" : "text-gray-800"
                          )}
                        >
                          {user?.name || "Usuario"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={cn(
                            "transition-transform duration-200",
                            isDesktopMenuOpen && "rotate-180",
                            isTransparent ? "text-gray-300" : "text-gray-500"
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {isDesktopMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30 border"
                          >
                            <Link
                              href={routes.app.perfil}
                              onClick={() => setIsDesktopMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <UserCircle size={16} />
                              Mi Perfil
                            </Link>
                            <Link
                              href={getDashboardUrl()}
                              onClick={() => setIsDesktopMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <LayoutDashboard size={16} />
                              Mi Panel
                            </Link>
                            <Link
                              href={routes.app.soporte}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <CircleQuestionMark size={18} /> Soporte
                            </Link>
                            <button
                              onClick={() => {
                                signOut({ callbackUrl: routes.public.home });
                                setIsDesktopMenuOpen(false);
                              }}
                              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <LogOut size={16} />
                              Cerrar Sesión
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Botón Principal: Para Complejos */}
                  <Link href={routes.public.clubs}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={isTransparent ? "text-white mr-2" : ""}
                    >
                      Software para Canchas
                    </Button>
                    <div className="border-r border-white/40 hidden md:inline"></div>
                  </Link>
                  <Link href={routes.auth.ingreso}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        isTransparent ? "text-white border border-white/30" : ""
                      }
                    >
                      Iniciar Sesión
                    </Button>
                  </Link>

                  <Link href={routes.auth.registro}>
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        "text-white bg-brand-orange border-brand-orange hover:bg-brand-orange/90 hover:text-whtie"
                      }
                    >
                      Comenzar Ahora
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="-mr-2 flex items-center md:hidden">
            {isLoggedIn && <NotificationBell isTransparent={isTransparent} />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className={cn(
                "inline-flex items-center justify-center p-2 rounded-md focus:outline-none transition-colors cursor-pointer",
                isTransparent
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-white text-brand-dark hover:bg-gray-100"
              )}
            >
              <span className="sr-only">Abrir menú</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 w-full h-[calc(100vh-4rem)] bg-background border-t md:hidden overflow-y-auto"
            id="mobile-menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {isLoggedIn ? (
                <>
                  <div className="px-3 py-2 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCircle size={24} className="text-gray-500" />
                    </div>
                    <span className="font-semibold text-gray-800">
                      {user?.name || "Usuario"}
                    </span>
                  </div>
                  <hr />
                  <Link
                    href={routes.public.canchas}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <Search size={18} /> Buscar Cancha
                  </Link>
                  <div
                    title="Torneos disponibles pronto"
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-gray-400 cursor-not-allowed"
                  >
                    <Trophy size={18} /> Torneos (Próximamente)
                  </div>
                  <Link
                    href={routes.app.perfil}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <UserCircle size={18} /> Mi Perfil
                  </Link>
                  <Link
                    href={getDashboardUrl()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <LayoutDashboard size={18} /> Mi Panel
                  </Link>
                  <Link
                    href={routes.app.soporte}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <CircleQuestionMark size={18} /> Soporte
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: routes.public.home });
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50 "
                  >
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={routes.public.clubs}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Software para canchas
                  </Link>
                  <Link
                    href={routes.auth.ingreso}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Iniciar Sesión
                  </Link>
                  <div
                    title="Torneos disponibles pronto"
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md text-gray-400 cursor-not-allowed"
                  >
                    <Trophy size={18} /> Torneos (Próximamente)
                  </div>
                </>
              )}

              <hr className="my-2" />
              <div className="flex justify-around items-center px-3 py-2 space-x-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    title={social.label}
                    className="p-2 rounded-full text-gray-600 hover:text-brand-orange hover:bg-gray-100 transition-colors"
                  >
                    <social.icon size={24} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
