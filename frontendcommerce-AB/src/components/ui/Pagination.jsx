"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "..";

/* -------------------- Root -------------------- */
const Pagination = ({ className, ...props }) => (
  <nav
    role="navigation"
    aria-label="Pagination"
    className={cn("flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

/* -------------------- Content -------------------- */
const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

/* -------------------- Item -------------------- */
const PaginationItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("list-none", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

/* -------------------- Link -------------------- */
const PaginationLink = ({
  className,
  isActive = false,
  size = "icon",
  ...props
}) => {
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size={size}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "h-9 min-w-9 rounded-full px-3 font-medium",
        isActive
          ? "bg-primary-600 text-white hover:bg-primary-600"
          : "text-neutral-600 hover:bg-neutral-100",
        className
      )}
      {...props}
    />
  );
};

/* -------------------- Previous -------------------- */
const PaginationPrevious = ({ className, ...props }) => (
  <PaginationLink
    size="default"
    aria-label="Go to previous page"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <div className="flex">
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Previous</span>
    </div>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

/* -------------------- Next -------------------- */
const PaginationNext = ({ className, ...props }) => (
  <PaginationLink
    size="default"
    aria-label="Go to next page"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <div className="flex">
      <span className="hidden sm:inline">Next</span>
      <ChevronRight className="h-4 w-4" />
    </div>
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

/* -------------------- Ellipsis -------------------- */
const PaginationEllipsis = ({ className, ...props }) => (
  <span
    aria-hidden
    className={cn(
      "flex h-9 w-9 items-center justify-center text-neutral-400",
      className
    )}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
