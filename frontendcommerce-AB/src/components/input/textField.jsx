"use client";
import clsx from "clsx";
import * as FaIcons from "react-icons/fa6";
import { useState } from "react";

export function TxtField({
  label,
  autoComplete,
  inputMode,
  className,
  variant = "filled",
  size = "md",
  iconLeftName,
  iconRightName,
  onRightIconClick,
  disabled = false,
  error = false,
  fullWidth = true,
  type = "text",
  ...props
}) {
  const baseStyles =
    "block w-full rounded-full transition-all duration-50 placeholder:text-neutral-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    filled:
      "rounded-full bg-neutral-50 hover:bg-neutral-100 focus:ring-1 focus:ring-neutral-300 ring-1 ring-neutral-200",
    outline:
      "rounded-full bg-white ring-1 ring-neutral-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-neutral-50",
    ghost:
      "bg-transparent ring-0 hover:bg-neutral-50 focus:ring-1 focus:ring-primary-400",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-3 py-2 text-lg",
  };

  const [showPassword, setShowPassword] = useState(false);

  const IconLeft = iconLeftName ? FaIcons[`Fa${iconLeftName}`] : null;
  let IconRight = iconRightName ? FaIcons[`Fa${iconRightName}`] : null;

  const padLeft = IconLeft ? "pl-10" : "pl-4";
  const padRight = IconRight ? "pr-10" : "pr-4";

  if (type === "Password") {
    IconRight = showPassword ? FaIcons.FaEyeSlash : FaIcons.FaEye;
  }

  return (
    <div className={clsx(fullWidth && "w-full")}>
      {/* Label di luar */}
      {label && (
        <h6 className="text-sm font-medium text-gray-700 mb-1">{label}</h6>
      )}

      <div className="relative">
        {IconLeft && (
          <span
            className={clsx(
              "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400"
            )}
          >
            <IconLeft className="h-4 w-4" aria-hidden="true" />
          </span>
        )}

        {!IconLeft && IconRight && (
          <span
            className={clsx(
              "absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400",
              onRightIconClick ? "cursor-pointer" : "pointer-events-none"
            )}
            onClick={() =>
              type === "Password"
                ? setShowPassword((prev) => !prev)
                : onRightIconClick?.()
            }
          >
            <IconRight className="h-4 w-4" aria-hidden="true" />
          </span>
        )}

        <input
          label={label}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={clsx(
            baseStyles,
            variants[variant],
            sizes[size],
            padLeft,
            padRight,
            error && "ring-1 ring-error-500 focus:ring-error-500",
            className
          )}
          type={type === "password" && showPassword ? "text" : type}
          disabled={disabled}
          aria-invalid={!!error}
          {...props}
        />
      </div>

      {typeof error === "string" && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}
