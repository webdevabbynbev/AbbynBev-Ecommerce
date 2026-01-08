"use client";

import { Button, QuantityInput } from "@/components";

export function MobileProductActionBar({
  stock = 0,
  onQtyChange,
  onAddToCart,
  onBuyNow,
}) {
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-4">
        <div className="rounded-2xl border border-primary-500 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center justify-between gap-3">
              <QuantityInput min={1} max={stock} onChange={onQtyChange} />
              <span className="text-xs text-neutral-600">
                Stock{" "}
                <span className="font-semibold text-neutral-950">{stock}</span>
              </span>
            </div>
            <div className="flex w-full items-center gap-3">
              <Button
                variant="primary"
                size="md"
                className="flex-1 rounded-full"
                onClick={onBuyNow}
              >
                Buy now
              </Button>
              <Button
                iconName="CartPlus"
                variant="tertiary"
                size="md"
                className="flex-1 rounded-full"
                onClick={onAddToCart}
              >
                Add to cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}