// components/ui/input.tsx
import React from "react";
import clsx from "clsx";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  const id = props.id || props.name;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={clsx(
          "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300",
          className
        )}
        {...props}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
