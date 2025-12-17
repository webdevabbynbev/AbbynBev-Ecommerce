"use client";
import clsx from "clsx";
import { cva } from "class-variance-authority";
import { Children, useState } from "react";
import * as FaIcons from "react-icons/fa6";
export function BtnIcon({
  children,
  iconName,
  variant = "primary",
  size = "medium",
  className,
  disabled = false,
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
      "bg-secondary-100 text-primary-700 hover:bg-secondary-200 focus:bg-Secondary300 transition-all duraton-200",
    tertiary:
      "bg-transparent border border-transparent font-bold text-primary-700 hover:bg-secondary-100 transition-all duration-200",
  };

  const sizes = {
    xs: "h-7 px-2 text-sm",
    sm: "h-9 px-3 text-sm", // ~36px tinggi
    md: "h-10 px-4 text-base", // ~340px tinggi
    lg: "h-12 px-4 text-lg", // ~52px tinggi
  };
  const iconColors = {
    primary: "text-white",
    secondary: "text-primary-700",
    tertiary: "text-primary-700",
  };
  // const [hover, setHover] = useState(false);

  const CurrentIcon = FaIcons[`FaReg${iconName}`] || FaIcons[`Fa${iconName}`];
  // const HoverIcon = FaIcons[`FaReg${iconName}`] || FaIcons[`Fa${iconName}`];
  // const CurrentIcon = hover ? IdleIcon : HoverIcon;

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      // onMouseEnter={() => setHover(true)}
      // onMouseLeave={() => setHover(false)}
      {...props}
    >
      {<CurrentIcon className={clsx(iconColors[variant])} />}
      {children}
    </button>
  );
}
