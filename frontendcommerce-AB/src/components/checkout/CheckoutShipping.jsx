"use client";

import { AddressCard } from "@/app/account";
import { NewAddress } from "@/app/account/popup";
import { n } from "@/utils/number";

export default function CheckoutShipping({
  // address
  displayAddresses = [],
  loadingAddr,
  selectedAddress,
  selectedAddressId,
  onSelectMain,
  onReloadAddresses,

  // shipping
  weightRounded,
  shippingAllCount = 0,
  loadingShip,
  shippingError,
  courierKeys = [],
  expandedCouriers = {},
  setExpandedCouriers,
  shippingGroups = {},
  bestByCourier = {},
  selectedShipping,
  confirmedShipping,
  onConfirmShipping,
}) {
  return (
    <>
      {/* ADDRESS */}
      <div className="p-4 font-medium text-base bg-muted border border-neutral-100 w-full rounded-2xl space-y-6">
        <div className="flex w-full items-center justify-between">
          <h3 className="font-bold">Shipping address</h3>
          <NewAddress onSuccess={() => onReloadAddresses?.()} />
        </div>

        {loadingAddr && <p className="text-gray-400 italic">Loading address...</p>}

        {!loadingAddr && !displayAddresses.length && (
          <p className="text-gray-400 italic">No address found</p>
        )}

        {!!displayAddresses.length && (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
            {displayAddresses.map((a) => (
              <AddressCard
                key={a.id}
                id={a.id}
                benchmark={a.benchmark || ""}
                label={a.picLabel || a.pic_label || ""}
                line={a.address || ""}
                city={a._cityName || ""}
                province={a._provinceName || ""}
                postalCode={a.postalCode || a.postal_code || ""}
                name={a.picName || a.pic_name || "receiver"}
                phone={
                  a.phone ||
                  a.picPhone ||
                  a.pic_phone ||
                  (a.pic && a.pic.phone) ||
                  ""
                }
                selected={a.id === selectedAddressId}
                disabled={loadingAddr}
                onSelect={onSelectMain}
              />
            ))}
          </div>
        )}
      </div>

      {/* SHIPPING */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Shipping method</h2>

        {!selectedAddress && (
          <p className="text-gray-400 italic">Pilih alamat dulu untuk lihat ongkir.</p>
        )}

        {selectedAddress && loadingShip && (
          <p className="text-gray-400 italic">Loading shipping options...</p>
        )}

        {selectedAddress && !!shippingError && (
          <div className="border border-red-300 bg-red-50 text-red-600 rounded-lg p-3 mb-3 text-sm">
            <div className="font-semibold">Shipping error</div>
            <div>{shippingError}</div>
          </div>
        )}

        {selectedAddress && !loadingShip && courierKeys.length === 0 && !shippingError && (
          <p className="text-gray-400 italic">
            Tidak ada opsi pengiriman. (cek district di alamat + KOMERCE_ORIGIN di backend)
          </p>
        )}

        {selectedAddress && !loadingShip && courierKeys.length > 0 && !confirmedShipping && (
          <div className="mb-3 text-sm text-gray-600">
            Pilih salah satu service pengiriman.
            {selectedShipping ? (
              <span className="ml-1 text-gray-500">
                <b>{selectedShipping.courier?.toUpperCase()}</b> {selectedShipping.service} Rp{" "}
                {n(selectedShipping.price, 0).toLocaleString("id-ID")}
              </span>
            ) : null}
          </div>
        )}

        <div className="space-y-3">
          {courierKeys.map((courier) => {
            const expanded = !!expandedCouriers[courier];
            const list = shippingGroups[courier] || [];
            const best = bestByCourier[courier];

            return (
              <div
                key={courier}
                onClick={() =>
                  setExpandedCouriers?.((prev) => ({ ...prev, [courier]: !prev[courier] }))
                }
                className={`rounded-xl border p-4 cursor-pointer transition ${
                  expanded ? "border-pink-600 bg-pink-50" : "hover:border-gray-400"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold uppercase">{courier}</p>
                    {best ? (
                      <p className="text-sm text-gray-600 mt-1">
                        Best: <span className="font-medium">{best.service}</span> • Rp{" "}
                        {n(best.price, 0).toLocaleString("id-ID")} • {best.estimate}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Tidak ada service.</p>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {expanded ? "Tutup" : `Lihat service (${list.length})`}
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 space-y-2">
                    {list.map((opt) => {
                      const isSelected = confirmedShipping?.id === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfirmShipping?.(opt);
                          }}
                          className={`p-3 rounded-xl border transition ${
                            isSelected
                              ? "border-pink-600 bg-white"
                              : "bg-white hover:border-gray-400"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="font-medium">
                                {opt.service} (Rp {n(opt.price, 0).toLocaleString("id-ID")})
                              </p>
                              {!!opt.description && (
                                <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 whitespace-nowrap">
                              {opt.estimate}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 mt-3">
          *Berat: {weightRounded} gram (rounded) | {shippingAllCount} service
        </p>
      </div>
    </>
  );
}
