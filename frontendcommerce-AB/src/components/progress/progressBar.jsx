"use client";

import React from "react";

export function ProgressBar({
  value = 0,
  height = 8,
  showLabel = false,
  label,
  className = "",
}) {
  const progress = Math.min(100, Math.max(0, Number(value) || 0));

  // warna adaptif (flash sale friendly)
  const barColor =
    progress <= 20
      ? "bg-red-500"
      : progress <= 50
      ? "bg-warning-400"
      : "bg-primary-700";

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1 text-xs font-medium text-neutral-600">
          {label ?? `${progress}%`}
        </div>
      )}

      <div
        className="w-full bg-neutral-200 rounded-full overflow-hidden"
        style={{ height }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Progress"
      >
        <div
          className={`h-full ${barColor} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
