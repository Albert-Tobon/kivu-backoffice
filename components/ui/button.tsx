// components/ui/button.tsx
"use client";

import React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

export const Button: React.FC<ButtonProps> = ({
  fullWidth,
  variant = "primary",
  className,
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition";

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400 shadow-sm",
    secondary:
      "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 focus:ring-slate-300",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-sm",
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
