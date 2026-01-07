"use client";
import clsx from "clsx";
import { Checkbox } from "@/components";

export function SubList({
  data = [],
  prefix,
  selectedFilters = [],
  onSelect,
  className = "",
}) {
  const list = Array.isArray(data) ? data : [];
  const selected = Array.isArray(selectedFilters) ? selectedFilters : [];

  return (
    <div className={clsx("space-y-2 py-2", className)}>
      {list.map((item) => {
        const uniqueId = `${prefix}-${item?.id}`;
        const isActive = selected.includes(uniqueId);
        const label =
          item?.category ??
          item?.skinconcern ??
          item?.bodyconcern ??
          item?.hairconcern ??
          item?.label ??
          "";

        return (
          <div
            key={uniqueId}
            onClick={() => onSelect?.(prefix, item?.id)}
            className={clsx(
              "w-full text-left px-2 py-2 flex items-center space-x-2 rounded-md transition-all text-xs cursor-pointer",
              isActive
                ? "bg-neutral-100"
                : "hover:bg-neutral-100"
            )}
          >
            <Checkbox id={uniqueId} checked={isActive} />
            <div>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
