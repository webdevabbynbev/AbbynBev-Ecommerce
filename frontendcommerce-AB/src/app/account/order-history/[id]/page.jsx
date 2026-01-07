"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import axios from "@/lib/axios";
import { n } from "@/utils/number";

const STEPS = [
  { key: "created", label: "Order created" },
  { key: "packaged", label: "Packaged" },
  { key: "on_delivery", label: "On delivery" },
  { key: "completed", label: "Order complete" },
];

const STATUS_BADGE = {
  pending: { text: "Waiting Payment", cls: "bg-yellow-50 text-yellow-700" },
  waiting_admin: { text: "Waiting Admin", cls: "bg-blue-50 text-blue-600" },
  processing: { text: "On Process", cls: "bg-indigo-50 text-indigo-600" },
  on_delivery: { text: "On Delivery", cls: "bg-purple-50 text-purple-600" },
  finished: { text: "Completed", cls: "bg-green-50 text-green-600" },
  cancelled: { text: "Cancelled", cls: "bg-red-50 text-red-600" },
  unknown: { text: "Unknown", cls: "bg-gray-50 text-gray-600" },
};

// backend enum: 1 waiting_payment, 5 paid_waiting_admin, 2 on_process, 3 on_delivery, 4 completed, 9 failed
function mapTransactionStatus(trxStatus) {
  const s = Number(trxStatus);
  if (s === 1) return "pending";
  if (s === 5) return "waiting_admin";
  if (s === 2) return "processing";
  if (s === 3) return "on_delivery";
  if (s === 4) return "finished";
  if (s === 9) return "cancelled";
  return "unknown";
}

function getCurrentStep(statusKey) {
  if (statusKey === "finished") return 3;
  if (statusKey === "on_delivery") return 2;
  if (statusKey === "processing") return 1;
  if (statusKey === "pending" || statusKey === "waiting_admin") return 0;
  if (statusKey === "cancelled") return 0;
  return 0;
}

function money(v) {
  return n(v, 0).toLocaleString("id-ID");
}

function safeDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
}

function arr(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function unwrapResponse(raw) {
  // handle: { message, serve: { data, waybill } }
  if (raw?.serve) raw = raw.serve;
  // handle: { data: TransactionEcommerce, waybill }
  if (
    raw?.data &&
    (raw?.waybill !== undefined ||
      raw?.data?.transaction ||
      raw?.data?.transactionId)
  ) {
    raw = raw.data;
  }
  return raw;
}

function buildAddressText(userAddress) {
  if (!userAddress) return { line1: "-", line2: "-", postal: "" };

  const addr =
    userAddress?.address ||
    userAddress?.line1 ||
    userAddress?.detail ||
    userAddress?.street ||
    "-";

  // biteship style
  const areaName =
    userAddress?.biteshipAreaName ||
    userAddress?.biteship_area_name ||
    userAddress?.areaName ||
    userAddress?.area_name ||
    "";

  // komerce style fallback
  const subDistrict =
    userAddress?.subDistrictData?.name ||
    userAddress?.sub_district_data?.name ||
    userAddress?.subDistrictName ||
    userAddress?.sub_district ||
    "";

  const district =
    userAddress?.districtData?.name ||
    userAddress?.district_data?.name ||
    userAddress?.districtName ||
    userAddress?.district ||
    "";

  const city =
    userAddress?.cityData?.name ||
    userAddress?.city_data?.name ||
    userAddress?.cityName ||
    userAddress?.city ||
    "";

  const province =
    userAddress?.provinceData?.name ||
    userAddress?.province_data?.name ||
    userAddress?.provinceName ||
    userAddress?.province ||
    "";

  const postal =
    userAddress?.postalCode ||
    userAddress?.postal_code ||
    userAddress?.zip ||
    userAddress?.zipCode ||
    "";

  const line2Old = [subDistrict, district, city, province]
    .filter(Boolean)
    .join(", ");
  const line2 = areaName || line2Old;

  return {
    line1: addr,
    line2: line2 || "-",
    postal: postal ? String(postal) : "",
  };
}

function normalizeOrder(rawInput) {
  const raw = unwrapResponse(rawInput);

  // raw biasanya TransactionEcommerce (punya .transaction, .userAddress, .shipments)
  const ecommerce = raw || {};
  const trx = ecommerce?.transaction || raw?.transaction || {};

  const details = arr(trx?.details);
  const trxShipments = arr(trx?.shipments);
  const ecoShipments = arr(ecommerce?.shipments);
  const shipments = trxShipments.length ? trxShipments : ecoShipments;
  const sh = shipments?.[0] || {};

  const userAddress = ecommerce?.userAddress || ecommerce?.user_address || null;
  const user = ecommerce?.user || trx?.user || {};

  const statusKey = mapTransactionStatus(
    trx?.transactionStatus ?? trx?.transaction_status ?? trx?.status
  );
  const badge = STATUS_BADGE[statusKey] || STATUS_BADGE.unknown;

  const items = details.map((d) => {
    const p = d?.product || {};
    const medias = Array.isArray(p?.medias) ? p.medias : [];
    const thumb =
      medias?.[0]?.url ||
      p?.thumbnail ||
      p?.image ||
      "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";

    return {
      id:
        d?.id ??
        `${trx?.transactionNumber || trx?.transaction_number || "trx"}-${
          d?.productId || "item"
        }`,
      name: p?.name || p?.title || "-",
      variant: d?.variant?.sku || d?.variant?.name || d?.attributes || "-",
      qty: n(d?.qty, 0),
      price: n(d?.price, 0),
      image: thumb,
    };
  });

  const computedSubtotal = items.reduce(
    (sum, it) => sum + n(it.price, 0) * n(it.qty, 0),
    0
  );
  const subtotal = n(trx?.subTotal ?? trx?.sub_total, 0) || computedSubtotal;

  const shipmentFee = n(
    sh?.price ?? ecommerce?.shippingCost ?? ecommerce?.shipping_cost,
    0
  );
  const total =
    n(trx?.grandTotal ?? trx?.grand_total ?? trx?.amount ?? trx?.total, 0) ||
    subtotal + shipmentFee;

  const addrText = buildAddressText(userAddress);

  const receiverName =
    userAddress?.picName ||
    userAddress?.pic_name ||
    userAddress?.name ||
    sh?.pic ||
    user?.fullName ||
    user?.name ||
    "-";

  const receiverPhone =
    userAddress?.picPhone ||
    userAddress?.pic_phone ||
    userAddress?.phone ||
    sh?.pic_phone ||
    user?.phone ||
    "-";

  const courierName =
    sh?.service || ecommerce?.courierName || ecommerce?.courier_name || "-";

  const courierService =
    sh?.serviceType ||
    sh?.service_type ||
    ecommerce?.courierService ||
    ecommerce?.courier_service ||
    "";

  const resi = sh?.resiNumber || sh?.resi_number || "";
  const estimated = sh?.estimationArrival || sh?.estimation_arrival || "";

  return {
    transactionNumber: trx?.transactionNumber || trx?.transaction_number || "-",
    statusKey,
    statusLabel: badge.text,
    statusCls: badge.cls,

    shipping: {
      orderDate: safeDate(trx?.createdAt || trx?.created_at),
      deliveryDate: "-",
      estimatedDelivery: estimated || "-",
      courier: String(courierName || "-").toUpperCase(),
      serviceType: String(courierService || "").toUpperCase(),
      resi,
    },

    address: {
      name: receiverName,
      line1: addrText.line1,
      line2: addrText.line2,
      phone: receiverPhone,
      postal: addrText.postal,
    },

    items,
    subtotal,
    serviceCharges: 0,
    shipmentFee,
    total,
  };
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [order, setOrder] = useState(null);

  const [confirming, setConfirming] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const transactionNumberFromUrl = params?.id
    ? decodeURIComponent(params.id)
    : "";

  const fetchOrder = async () => {
    if (!transactionNumberFromUrl) return;

    setLoading(true);
    setErrorMsg("");

    try {
      // 1) retrieve (paling lengkap)
      try {
        const res0 = await axios.post("/transaction/retrieve", {
          transaction_number: transactionNumberFromUrl,
        });

        const payload =
          res0?.data?.serve?.data || res0?.data?.data || res0?.data;

        if (payload) {
          setOrder(normalizeOrder(payload));
          return;
        }
      } catch {
        // ignore -> fallback
      }

      // 2) fallback list by filter
      const res = await axios.get("/transaction", {
        params: {
          transaction_number: transactionNumberFromUrl,
          page: 1,
          per_page: 1,
        },
      });

      const row = res?.data?.serve?.data?.[0];
      if (row) {
        setOrder(normalizeOrder(row));
        return;
      }

      setOrder(null);
      setErrorMsg("Order tidak ditemukan.");
    } catch (err) {
      console.log("Error order detail:", err?.response?.data || err);
      setOrder(null);
      setErrorMsg(
        err?.response?.data?.message || "Failed to load order detail"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDone = async () => {
    if (!order?.transactionNumber || confirming) return;

    const ok = window.confirm(
      "Selesaikan pesanan ini? Status akan jadi Completed."
    );
    if (!ok) return;

    try {
      setConfirming(true);
      setErrorMsg("");
      setInfoMsg("");

      await axios.post("/transaction/confirm", {
        transaction_number: order.transactionNumber,
      });

      setInfoMsg("Pesanan berhasil diselesaikan.");
      await fetchOrder();
    } catch (err) {
      console.log("Confirm error:", err?.response?.data || err);
      setErrorMsg(
        err?.response?.data?.message || "Gagal menyelesaikan pesanan."
      );
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionNumberFromUrl]);

  const currentStep = useMemo(() => {
    if (!order) return 0;
    return getCurrentStep(order.statusKey);
  }, [order]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/account/order-history")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back to My Order
        </button>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-gray-400">Loading order detail...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/account/order-history")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Back to My Order
        </button>

        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4 text-sm">
          {errorMsg || "Order not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push("/account/order-history")}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ← Back to My Order
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Order Tracking
      </h1>

      <div className="bg-white border border-pink-100 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((step, index) => {
            const isDone = index < currentStep;
            const isCurrent = index === currentStep;
            const isLast = index === STEPS.length - 1;

            return (
              <div key={step.key} className="flex-1 flex items-center min-w-0">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={[
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold",
                      isDone || isCurrent
                        ? "bg-pink-600 border-pink-600 text-white"
                        : "bg-white border-gray-300 text-gray-400",
                    ].join(" ")}
                  >
                    {isDone ? "✓" : index + 1}
                  </div>
                  <p
                    className={
                      "text-xs font-medium text-center " +
                      (isDone || isCurrent ? "text-pink-600" : "text-gray-400")
                    }
                  >
                    {step.label}
                  </p>
                </div>

                {!isLast && (
                  <div
                    className={
                      "flex-1 h-[2px] mx-2 " +
                      (index < currentStep ? "bg-pink-600" : "bg-gray-200")
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ sukses */}
      {infoMsg ? (
        <div className="mb-4 border border-green-200 bg-green-50 text-green-700 rounded-lg p-3 text-sm">
          {infoMsg}
        </div>
      ) : null}

      {/* ✅ error (ini yang sebelumnya belum keliatan pas order ada) */}
      {errorMsg ? (
        <div className="mb-4 border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
          {errorMsg}
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Order Detail
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Order ID: {order.transactionNumber}
            </p>
          </div>

          <div className="text-right space-y-2">
            <p className="text-xs text-gray-500">
              No pesanan: {order.transactionNumber}
            </p>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${order.statusCls}`}
            >
              {order.statusLabel}
            </span>

            {/* tombol hanya saat on_delivery */}
            {order.statusKey === "on_delivery" && (
              <button
                onClick={handleConfirmDone}
                disabled={confirming}
                className={[
                  "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold",
                  confirming
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-pink-600 text-white hover:bg-pink-700",
                ].join(" ")}
              >
                {confirming ? "Memproses..." : "Selesaikan Pesanan"}
              </button>
            )}
          </div>
        </div>

        <div className="border border-gray-100 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Shipping</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-400 mb-1">Order Date</p>
              <p className="text-gray-800">{order.shipping.orderDate}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Delivery Date</p>
              <p className="text-gray-800">{order.shipping.deliveryDate}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Estimated Delivery</p>
              <p className="text-gray-800">
                {order.shipping.estimatedDelivery}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Courier</p>
              <p className="text-gray-800">
                {order.shipping.courier}
                {order.shipping.serviceType
                  ? ` (${order.shipping.serviceType})`
                  : ""}
              </p>
            </div>
          </div>

          <div className="mt-3 text-xs">
            <p className="text-gray-400 mb-1">Resi</p>
            <p className="text-gray-800 font-medium">
              {order.shipping.resi ? order.shipping.resi : "-"}
            </p>
          </div>
        </div>

        <div className="border border-gray-100 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Shipping Address
          </h3>
          <div className="text-xs text-gray-700 space-y-1">
            <p className="font-medium">{order.address.name}</p>
            <p>{order.address.line1}</p>
            <p>{order.address.line2}</p>
            {order.address.postal ? (
              <p>{`Postal: ${order.address.postal}`}</p>
            ) : null}
            <p>{order.address.phone}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 border border-gray-100 rounded-lg p-3"
            >
              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Variant: {item.variant}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">x{item.qty}</p>
              </div>

              <div className="text-sm font-medium text-gray-900">
                Rp {money(item.price)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal Product</span>
            <span className="font-medium text-gray-900">
              Rp {money(order.subtotal)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">service charges</span>
            <span className="font-medium text-gray-900">
              Rp {money(order.serviceCharges)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Shipment</span>
            <span className="font-medium text-gray-900">
              Rp {money(order.shipmentFee)}
            </span>
          </div>

          <div className="flex justify-between pt-2 border-t border-dashed border-gray-200 mt-2">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-base font-bold text-pink-600">
              Rp {money(order.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
