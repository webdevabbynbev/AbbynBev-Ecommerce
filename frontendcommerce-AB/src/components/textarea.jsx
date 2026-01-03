import * as React from "react";
import clsx from "clsx";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(
  ({ fullWidth = true,variant, label, className, ...props }, ref) => {
    const baseStyles =
      "block w-full rounded-full transition-all min-h-[100px] max-h-[150px]  duration-50 placeholder:text-neutral-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";

    const variants = {
      filled:
        "rounded-full bg-neutral-50 hover:bg-neutral-100 focus:ring-1 focus:ring-neutral-300 ring-1 ring-neutral-200",
      outline:
        "rounded-full bg-white ring-1 ring-neutral-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-neutral-50",
      ghost:
        "bg-transparent ring-0 hover:bg-neutral-50 focus:ring-1 focus:ring-primary-400",
    };
    return (
      <div className={clsx(fullWidth && "w-full")}>
        {/* Label di luar */}
        {label && (
          <h6 className="text-sm font-medium text-gray-700 mb-1">{label}</h6>
        )}

        <textarea
          className={cn(
            baseStyles,
            variants[variant],
            "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
