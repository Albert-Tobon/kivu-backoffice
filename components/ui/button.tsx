// components/ui/button.tsx
"use client";

import React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button: React.FC<ButtonProps> = ({
  fullWidth,
  className,
  children,
  variant = "primary",
  size = "md",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses: Record<ButtonVariant, string> = {
    // Verde KIVU
    primary:
      "bg-[#ACF227] text-slate-900 hover:bg-[#9AD51F] focus-visible:ring-[#ACF227] shadow-sm",
    // Rojo para eliminar
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm",
    // Contorno verde, fondo blanco
    ghost:
      "border border-[#ACF227] bg-white text-slate-900 hover:bg-[#ACF227]/10 focus-visible:ring-[#ACF227]",
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
export { Button };
