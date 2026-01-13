"use client";

import Image from "next/image";
import { n } from "@/utils/number";

export default function CheckoutCart({
  checkoutItems = [],
  loadingCart,
  loadingPay,
  loadingItemId,
  onUpdateQty,
  onDelete,
}) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-5">Your order</h2>

      {loadingCart && <p className="text-gray-400 italic">Loading cart...</p>}

      {!loadingCart && checkoutItems.length === 0 && (
        <p className="text-gray-400 italic">No selected products</p>
      )}

      {checkoutItems.map((item, idx) => {
        const product = item.product || {};
        const image =
          product.thumbnail ||
          product.image ||
          "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";

        const quantity = n(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 1, 1);
        const isBusy = loadingItemId !== null && loadingItemId === item.id;

        const productName =
          product.name || product.title || item.product_name || item.productName || "-";

        const variantName =
          item?.variant?.name ||
          item?.variant?.sku ||
          item?.variant?.code ||
          item?.variant_name ||
          product?.variant_name ||
          "-";

        return (
          <div
            key={item.id ?? `tmp-${idx}`}
            className="flex justify-between items-center border-b pb-4 mb-4"
          >
            <div className="flex gap-3 items-center">
              <Image
                src={image}
                width={60}
                height={60}
                alt={productName}
                className="rounded-md"
              />
              <div>
                <p className="font-medium">{productName}</p>
                <p className="text-sm text-gray-500">Variant: {variantName}</p>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={isBusy || quantity <= 1 || loadingPay}
                      onClick={() => onUpdateQty?.(item, quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border rounded-full text-sm disabled:opacity-40"
                    >
                      -
                    </button>

                    <span className="min-w-8 text-center">{quantity}</span>

                    <button
                      disabled={isBusy || loadingPay}
                      onClick={() => onUpdateQty?.(item, quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center border rounded-full text-sm disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    disabled={isBusy || loadingPay}
                    onClick={() => onDelete?.(item)}
                    className="text-xs text-red-500 hover:underline disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <p className="font-semibold text-pink-600 text-right">
              Rp {n(item.amount ?? item.price ?? product.price ?? 0, 0).toLocaleString("id-ID")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
