"use client";

import { Button } from "@/components";

export function MobileCartActionBar({
  allSelected,
  selectedCount,
  subtotal,
  loadingCheckout,
  onToggleSelectAll,
  onCheckout,
}) {
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-4">
        <div className="rounded-2xl border border-primary-500 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between text-sm text-neutral-700">
            <span className="flex items-center gap-2">
              <span aria-hidden className="text-lg">
                ⚙️
              </span>
              Promo
            </span>
            <span className="font-medium text-primary-700">
              Available promo (2)
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-pink-600 cursor-pointer"
                  checked={allSelected}
                  disabled={loadingCheckout}
                  onChange={(e) => onToggleSelectAll?.(e.target.checked)}
                />
                Semua
              </label>
              <div className="pl-7 text-xs text-neutral-500">
                Subtotal
                <span className="ml-2 text-base font-semibold text-primary-700">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              className="ml-auto rounded-full px-6"
              disabled={loadingCheckout || selectedCount === 0}
              onClick={onCheckout}
            >
              {loadingCheckout ? "Processing..." : "Checkout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}