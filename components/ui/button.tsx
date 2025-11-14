// components/ui/button.tsx
import React from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  fullWidth,
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
