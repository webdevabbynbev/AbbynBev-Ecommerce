"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import { n } from "@/utils/number";

// ===== Config (biar ga hardcode nyebar) =====
const ACCOUNT_NAV = [
  { href: "/account", label: "Profile management" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/order-history", label: "Order History", active: true },
];

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "ongoing", label: "Ongoing" },
  { key: "success", label: "Success" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_UI = {
  finished: {
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    message: "Your order is completed!",
    icon: "✓",
  },
  pending: {
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    message: "Waiting for payment confirmation",
    icon: "",
  },
  processing: {
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    message: "Your order is being processed",
    icon: "⚙",
  },
  on_delivery: {
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    message: "Your order is on the way",
    icon: "",
  },
  cancelled: {
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    message: "Order has been cancelled",
    icon: "✕",
  },
  unknown: {
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    message: "Order status unknown",
    icon: "•",
  },
};

// backend enum: 1 waiting_payment, 2 on_process, 3 on_delivery, 4 completed, 9 failed
const mapTransactionStatus = (trxStatus) => {
  const s = Number(trxStatus);
  if (s === 1) return "pending";
  if (s === 2) return "processing";
  if (s === 3) return "on_delivery";
  if (s === 4) return "finished";
  if (s === 9) return "cancelled";
  return "unknown";
};

// normalize response GET /transaction -> UI shape
const normalizeOrders = (rows) => {
  const arr = Array.isArray(rows) ? rows : [];

  return arr.map((row) => {
    const trx = row?.transaction || {};
    const details = Array.isArray(trx?.details) ? trx.details : [];

    const items = details.map((d) => {
      const p = d?.product || {};
      const medias = Array.isArray(p?.medias) ? p.medias : [];

      const thumb =
        medias?.[0]?.url ||
        p?.thumbnail ||
        p?.image ||
        "/placeholder.png";

      return {
        id: d?.id ?? `${trx?.transactionNumber || "trx"}-${d?.productId || "item"}`,
        product: {
          name: p?.name || p?.title || "-",
          thumbnail: thumb,
          variant_name: d?.attributes || "-", // attributes nyimpen variant text
          price: n(d?.price, 0),
        },
        quantity: n(d?.qty, 0),
      };
    });

    return {
      id: row?.id ?? trx?.id ?? trx?.transactionNumber,
      transaction_number: trx?.transactionNumber || "-",
      status: mapTransactionStatus(trx?.transactionStatus),
      created_at: trx?.createdAt || trx?.created_at || new Date().toISOString(),
      total_price: n(trx?.grandTotal ?? trx?.amount, 0),
      items,
    };
  });
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // backend paginate default 10, jadi kita minta lebih besar
      const res = await axios.get("/transaction", {
        params: { page: 1, per_page: 50, field: "created_at", value: "desc" },
      });

      const rows = res.data?.serve?.data ?? [];
      setOrders(normalizeOrders(rows));
    } catch (err) {
      console.log("Error order:", err?.response?.data || err);
      setOrders([]);
      setErrorMsg(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filterOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];

    return list.filter((o) => {
      const st = o?.status || "unknown";
      if (filter === "all") return true;
      if (filter === "ongoing") return ["pending", "processing", "on_delivery"].includes(st);
      if (filter === "success") return ["finished"].includes(st);
      if (filter === "cancelled") return ["cancelled"].includes(st);
      return true;
    });
  }, [orders, filter]);

  const getStatusInfo = (status) => STATUS_UI[status] || STATUS_UI.unknown;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-1">
              {ACCOUNT_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                    item.active
                      ? "text-pink-600 bg-pink-50 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Order history</h2>

          {/* Filter Tabs */}
          <div className="flex gap-3 mb-6">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
                  filter === tab.key
                    ? "bg-pink-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-pink-300"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={loadOrders}
              className="ml-auto px-4 py-2 text-sm font-medium rounded-full border border-gray-200 hover:border-pink-300 bg-white text-gray-600"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Order List */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Loading orders...</p>
            </div>
          ) : filterOrders.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filterOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const items = Array.isArray(order.items) ? order.items : [];
                const totalQty = items.reduce((sum, item) => sum + n(item?.quantity, 0), 0);

                return (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-5">
                    {/* Status Message */}
                    <div
                      className={`${statusInfo.bgColor} ${statusInfo.textColor} px-4 py-2.5 rounded-md flex items-center justify-between mb-4`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{statusInfo.icon}</span>
                        <span className="text-sm font-medium">{statusInfo.message}</span>
                      </div>
                      <div className="text-xs">
                        Order created:{" "}
                        {new Date(order.created_at).toLocaleDateString("en-GB")}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-4 mb-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4">
                          <Image
                            src={item.product.thumbnail}
                            alt={item.product.name}
                            width={60}
                            height={60}
                            className="rounded-md border border-gray-200 object-cover"
                          />

                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm mb-1">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-500 mb-0.5">
                              Variant: {item.product.variant_name || "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} item • Rp{" "}
                              {n(item.product.price, 0).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">{order.transaction_number}</p>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Total</p>
                          <p className="text-base font-bold text-gray-900">
                            {totalQty} item: Rp{n(order.total_price, 0).toLocaleString("id-ID")}
                          </p>
                        </div>

                        <Link
                          href={`/account/order-history/${encodeURIComponent(order.transaction_number)}`}
                          className="px-5 py-2 text-xs font-medium text-white bg-pink-600 rounded-full hover:bg-pink-700 transition-colors"
                        >
                          See Transactions detail
                        </Link>

                        <button
                          className="px-5 py-2 text-xs font-medium text-pink-600 bg-white border border-pink-600 rounded-full hover:bg-pink-50 transition-colors"
                          onClick={() => alert("TODO: Buy again flow")}
                        >
                          Buy again
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
