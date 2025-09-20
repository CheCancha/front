// src/shared/components/ui/Buttons.tsx
"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { RippleButton } from "@/shared/components/magicui/ripple-button";

// --- Interfaz de Props Base ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  icon?: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

// --- Componente Base (interno) ---
const ButtonBase: React.FC<ButtonProps> = ({
  href,
  children,
  icon,
  className,
  target,
  rel,
  ...props
}) => {
  const content = (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} target={target} rel={rel}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} {...props}>
      {content}
    </button>
  );
};

// --- 1. Botón Primario ---
export const ButtonPrimary: React.FC<ButtonProps> = ({
  className,
  ...props
}) => {
  const primaryClasses =
    "bg-brand-orange text-white hover:bg-opacity-90 shadow-sm";
  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-bold text-base transition-colors duration-300 cursor-pointer py-3 px-8";

  return (
    <ButtonBase
      className={cn(baseClasses, primaryClasses, className)}
      {...props}
    />
  );
};

// --- 2. Botón Secundario ---
export const ButtonSecondary: React.FC<ButtonProps> = ({
  className,
  ...props
}) => {
  const secondaryClasses =
    "bg-transparent border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white";
  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-bold text-base transition-colors duration-300 cursor-pointer py-3 px-8";

  return (
    <ButtonBase
      className={cn(baseClasses, secondaryClasses, className)}
      {...props}
    />
  );
};

// --- 3. Botón Fantasma (Ghost) ---
export const ButtonGhost: React.FC<ButtonProps> = ({ className, ...props }) => {
  const ghostClasses = "bg-transparent text-foreground hover:bg-background";
  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-bold text-base transition-colors duration-300 cursor-pointer py-3 px-8";

  return (
    <ButtonBase
      className={cn(baseClasses, ghostClasses, className)}
      {...props}
    />
  );
};
// --- 4. NUEVO Botón con Efecto Ripple ---
export const ButtonRipple: React.FC<ButtonProps> = ({
  href,
  children,
  icon,
  className,
  target,
  rel,
  ...props
}) => {
  const primaryClasses = "bg-brand-orange text-white hover:bg-foreground";
  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-bold text-base transition-colors duration-300 cursor-pointer py-3 px-8";

  const content = (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </>
  );

  const rippleButton = (
    <RippleButton
      className={cn(baseClasses, primaryClasses, className)}
      {...props}
    >
      {content}
    </RippleButton>
  );

  if (href) {
    return <Link href={href} target={target} rel={rel}>{rippleButton}</Link>;
  }


  return rippleButton;
};
