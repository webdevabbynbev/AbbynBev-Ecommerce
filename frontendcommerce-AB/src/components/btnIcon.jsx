"use client";
import clsx from "clsx";
import * as FaIcons from "react-icons/fa6";

export function BtnIcon({
  children,
  iconName,
  variant = "primary",
  size = "md",
  className,
  disabled = false,
  as = "button", // ✅ "button" | "span" | "div"
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-bold rounded-[24px] " +
    "p-0 leading-none select-none transition-colors " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary-700 text-white hover:bg-primary-600 focus:bg-primary-800 transition-all duration-200",
    secondary:
      "bg-secondary-100 text-primary-700 hover:bg-secondary-200 focus:bg-Secondary300 transition-all duration-200",
    tertiary:
      "bg-transparent border border-transparent font-bold text-primary-700 hover:bg-secondary-100 transition-all duration-200",
  };

  const sizes = {
    xs: "h-7 px-2 text-sm",
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-base",
    lg: "h-12 px-4 text-lg",
  };

  const iconColors = {
    primary: "text-white",
    secondary: "text-primary-700",
    tertiary: "text-primary-700",
  };

  const CurrentIcon = FaIcons[`FaReg${iconName}`] || FaIcons[`Fa${iconName}`];

  const Comp = as; // "button" / "span" / "div"

  return (
    <Comp
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      // ✅ hanya set disabled kalau memang button
      disabled={as === "button" ? disabled : undefined}
      {...props}
    >
      {CurrentIcon ? (
        <CurrentIcon className={clsx(iconColors[variant])} />
      ) : null}
      {children}
    </Comp>
  );
}