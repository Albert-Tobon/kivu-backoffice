// components/ui/button.tsx
import React from "react";
import clsx from "clsx";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  fullWidth,
  className,
  ...props
}) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        variant === "primary" &&
          "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        variant === "outline" &&
          "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:ring-blue-500",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
