"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components";
import { PAYMENT_METHODS } from "@/data/paymentMethods";
import { n } from "@/utils/number";
import { fetchMyVouchers } from "@/services/checkout/voucher";

// hitung diskon voucher (ringkas + aman kalau data claim/nested)
function calcVoucherDiscount(v, subTotal, shippingPrice) {
  if (!v) return 0;

  // kalau v hasil dari VoucherClaim, ambil v.voucher
  const vo = v?.voucher ?? v;

  const isPercentage = Number(vo?.isPercentage ?? vo?.is_percentage ?? 0) === 1;
  const type = Number(vo?.type ?? 0); // 2 = shipping
  const percentage = n(vo?.percentage ?? 0, 0);
  const maxDiscPrice = n(vo?.maxDiscPrice ?? vo?.max_disc_price ?? 0, 0);
  const fixedPrice = n(vo?.price ?? 0, 0);

  if (isPercentage) {
    if (type === 2) {
      const disc = Math.floor(shippingPrice * (percentage / 100));
      const capped = maxDiscPrice > 0 ? Math.min(disc, maxDiscPrice) : disc;
      return Math.max(0, Math.min(capped, shippingPrice));
    }
    const disc = Math.floor(subTotal * (percentage / 100));
    return Math.max(0, maxDiscPrice > 0 ? Math.min(disc, maxDiscPrice) : disc);
  }

  if (type === 2) return Math.max(0, Math.min(fixedPrice, shippingPrice));
  return Math.max(0, fixedPrice);
}

export default function CheckoutPayment({
  subtotal,
  checkoutCount,
  confirmedShipping,
  loadingPay,
  loadingCart,
  loadingAddr,
  loadingShip,
  selectedAddressId,

  selectedPayment,
  setSelectedPayment,

  selectedVoucher,
  setSelectedVoucher,

  onPayNow,
}) {
  const router = useRouter();

  const [voucherOpen, setVoucherOpen] = useState(false);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  const shippingPriceNum = n(confirmedShipping?.price, 0);

  const voucherDiscount = useMemo(() => {
    // simpan voucher object saja biar consistent
    const vo = selectedVoucher?.voucher ?? selectedVoucher;
    return calcVoucherDiscount(vo, subtotal, shippingPriceNum);
  }, [selectedVoucher, subtotal, shippingPriceNum]);

  const total = useMemo(() => {
    return Math.max(0, subtotal + shippingPriceNum - voucherDiscount);
  }, [subtotal, shippingPriceNum, voucherDiscount]);

  // fetch vouchers saat dialog dibuka
  useEffect(() => {
    if (!voucherOpen) return;
    (async () => {
      try {
        setLoadingVoucher(true);
        const list = await fetchMyVouchers();
        setMyVouchers(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        alert(e?.response?.data?.message || e?.message || "Gagal load voucher kamu");
      } finally {
        setLoadingVoucher(false);
      }
    })();
  }, [voucherOpen]);

  const pickedVoucher = selectedVoucher?.voucher ?? selectedVoucher;

  return (
    <div className="w-90 bg-white border rounded-2xl shadow-md p-6 h-fit">
      <h2 className="text-xl font-semibold mb-6">Payment</h2>

      <div className="space-y-5">
        {PAYMENT_METHODS.map((method) => (
          <label key={method.id} className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Image src={method.icon} width={42} height={42} alt={method.name} />
              <span>{method.name}</span>
            </div>

            <input
              type="radio"
              name="payment"
              checked={selectedPayment === method.id}
              onChange={() => setSelectedPayment(method.id)}
              className="w-5 h-5 accent-pink-600"
              disabled={loadingPay}
            />
          </label>
        ))}
      </div>

      {/* VOUCHER PICKER */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Voucher</div>

          <Dialog open={voucherOpen} onOpenChange={setVoucherOpen}>
            <DialogTrigger asChild>
              <button
                disabled={loadingPay}
                className="px-3 py-2 rounded-full border hover:bg-gray-50 text-sm disabled:opacity-50"
              >
                Pilih Voucher
              </button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Pilih Voucher (1 saja)</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                {loadingVoucher ? (
                  <div className="text-gray-500 italic">Loading...</div>
                ) : myVouchers.length === 0 ? (
                  <div className="space-y-2">
                    <div className="text-gray-500 italic">
                      Kamu belum punya voucher. Claim dulu di halaman voucher.
                    </div>
                    <button
                      onClick={() => {
                        setVoucherOpen(false);
                        router.push("/vouchers");
                      }}
                      className="px-4 py-2 rounded-full bg-pink-600 text-white text-sm"
                    >
                      Buka Halaman Voucher
                    </button>
                  </div>
                ) : (
                  myVouchers.map((row) => {
                    // row bisa VoucherClaim atau Voucher
                    const vo = row?.voucher ?? row;
                    const isSelected = (pickedVoucher?.id ?? null) === (vo?.id ?? null);

                    const labelType = Number(vo?.type) === 2 ? "Diskon Ongkir" : "Diskon Belanja";
                    const labelValue =
                      Number(vo?.isPercentage ?? vo?.is_percentage ?? 0) === 1
                        ? `${n(vo?.percentage, 0)}% (maks Rp ${n(
                            vo?.maxDiscPrice ?? vo?.max_disc_price,
                            0
                          ).toLocaleString("id-ID")})`
                        : `Rp ${n(vo?.price, 0).toLocaleString("id-ID")}`;

                    return (
                      <button
                        key={vo?.id ?? row?.id}
                        onClick={() => setSelectedVoucher(vo)} // simpan voucher object aja
                        className={`w-full text-left border rounded-xl p-3 hover:bg-gray-50 ${
                          isSelected ? "border-pink-600 bg-pink-50" : ""
                        }`}
                      >
                        <div className="font-semibold">
                          {vo?.name || vo?.code || `Voucher #${vo?.id}`}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {labelType} • {labelValue}
                        </div>
                      </button>
                    );
                  })
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setSelectedVoucher(null)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Hapus voucher
                  </button>

                  <button
                    onClick={() => setVoucherOpen(false)}
                    className="px-4 py-2 rounded-full bg-pink-600 text-white text-sm"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {pickedVoucher ? (
          <div className="mt-2 text-xs text-gray-700">
            Dipakai: <b>{pickedVoucher?.name || pickedVoucher?.code || `#${pickedVoucher?.id}`}</b>
          </div>
        ) : (
          <div className="mt-2 text-xs text-gray-500 italic">Belum pakai voucher</div>
        )}
      </div>

      <hr className="my-6" />

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>{checkoutCount} product(s)</span>
          <span>Rp {subtotal.toLocaleString("id-ID")}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipment:</span>
          <span>
            {confirmedShipping ? `Rp ${shippingPriceNum.toLocaleString("id-ID")}` : "-"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Voucher:</span>
          <span>{voucherDiscount > 0 ? `- Rp ${voucherDiscount.toLocaleString("id-ID")}` : "-"}</span>
        </div>

        <div className="flex justify-between font-semibold text-lg">
          <span>Total:</span>
          <span className="text-pink-600">Rp {total.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <button
        onClick={onPayNow}
        disabled={
          loadingPay ||
          loadingCart ||
          loadingAddr ||
          loadingShip ||
          !selectedAddressId ||
          !confirmedShipping ||
          !selectedPayment ||
          checkoutCount === 0
        }
        className="w-full mt-6 py-3 bg-pink-600 text-white rounded-full font-semibold disabled:opacity-50"
      >
        {loadingPay ? "Processing..." : "Pay now"}
      </button>
    </div>
  );
}
