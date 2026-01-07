import { Skeleton } from "..";
import { cn } from "@/lib/utils";

export function RegularCardSkeleton({ className }) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col rounded-lg bg-white space-y-4 overflow-hidden animate-pulse",
        className
      )}
    >
      <Skeleton className="flex w-full h-[150px] bg-neutral-100 rounded-md" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4 bg-neutral-100 rounded" />
        <Skeleton className="h-4 w-1/2 bg-neutral-100 rounded" />
        <div className="flex space-x-2">
          <Skeleton className="h-4 w-12 bg-neutral-100 rounded" />
          <Skeleton className="h-4 w-8 bg-neutral-100 rounded" />
        </div>
        <Skeleton className="h-3 w-2/3 bg-neutral-100 rounded" />
      </div>
    </div>
  );
}

export function FilterSkeleton({ className }) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col rounded-lg bg-white space-y-4 overflow-hidden animate-pulse",
        className
      )}
    >
      {" "}
      <Skeleton className="flex w-full h-[150px] bg-neutral-100 rounded-md" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4 bg-neutral-100 rounded" />
        <Skeleton className="h-4 w-1/2 bg-neutral-100 rounded" />
        <div className="flex space-x-2">
          <Skeleton className="h-4 w-12 bg-neutral-100 rounded" />
          <Skeleton className="h-4 w-8 bg-neutral-100 rounded" />
        </div>
        <Skeleton className="h-3 w-2/3 bg-neutral-100 rounded" />
      </div>
    </div>
  );
}
