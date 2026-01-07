"use client";
import clsx from "clsx";
import * as FaIcons from "react-icons/fa";

export function BtnIconToggle({
  active = false,
  iconName,
  variant = "primary",
  size = "md",
  className,
  disabled = false,
  ...props
}) {
  const baseStyles =
    "rounded-[24px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary-700 text-white hover:bg-primary-600",
    secondary:
      "bg-secondary-100 text-primary-700 hover:bg-secondary-200",
    tertiary:
      "bg-transparent text-primary-700 hover:bg-secondary-100",
  };

  const sizes = {
    sm: "p-2 text-sm",
    md: "p-3 text-base",
    lg: "p-4 text-lg",
  };

  // ICON YANG BENAR
  const OutlineIcon = FaIcons.FaRegHeart;
  const SolidIcon = FaIcons.FaHeart;

  const Icon = active ? SolidIcon : OutlineIcon;

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      <Icon />
    </button>
  );
}
