"use client";
import clsx from "clsx";
import * as FaIcons from "react-icons/fa";

export function Button({
  type,
  accept,
  iconName,
  children,
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
      "bg-primary-700 text-white hover:bg-primary-600 focus:bg-primary-800 transition-all duration-200 cursor-pointer",
    secondary:
      "bg-secondary-100 text-primary-700 hover:bg-secondary-200 focus:bg-Secondary300 transition-all duration-200 cursor-pointer",
    tertiary:
      "bg-transparent border border-transparent font-bold text-primary-700 hover:bg-secondary-100 transition-all duration-200 cursor-pointer",
    error:
      "bg-transparent border border-transparent font-bold text-error-700 hover:bg-error-50 transition-all duration-200 cursor-pointer",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs", // ~36px tinggi
    md: "h-10 px-4 text-sm", // ~40px tinggi
    lg: "h-12 px-4 text-base", // ~52px tinggi
  };

  const iconColors = {
    primary: "text-white",
    secondary: "text-primary-700",
    tertiary: "text-primary-700",
  };
  // const [hover, setHover] = useState(false);

  const CurrentIcon = FaIcons[`FaReg${iconName}`] || FaIcons[`Fa${iconName}`];

  return (
    <button
      type={type}
      accept={accept}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        className,
        "items-center flex space-x-2 justify-center"
      )}
      disabled={disabled}
      {...props}
    >
      {CurrentIcon && (
        <CurrentIcon
          // kunci ukuran & cegah ikon “menggelembung” tinggi baris
          className={clsx("shrink-0", iconColors[variant], {
            "text-[12px]": size === "sm",
            "text-[14px]": size === "md",
            "text-[16px]": size === "lg",
          })}
          aria-hidden
        />
      )}
      {CurrentIcon ? (
        <span className="ml-1 leading-none">{children}</span>
      ) : (
        <span className="leading-none">{children}</span>
      )}
    </button>
  );
}
