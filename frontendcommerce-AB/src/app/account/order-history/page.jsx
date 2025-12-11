"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

const STATUS_COLOR = {
  arrived: "bg-green-100 text-green-600",
  pending: "bg-yellow-100 text-yellow-600",
  cancelled: "bg-red-100 text-red-600",
  success: "bg-green-100 text-green-600",
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data.data || []);
    } catch (err) {
      console.log("Error load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders =
    tab === "all" ? orders : orders.filter((o) => o.status === tab);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-4">Order History</h1>

      {/* TAB FILTER */}
      <div className="flex gap-4 mb-6">
        {["all", "ongoing", "success", "cancelled"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-1 rounded-full border text-sm capitalize",
              tab === t
                ? "bg-pink-600 text-white border-pink-600"
                : "text-gray-600 border-gray-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ORDER LIST */}
      <div className="flex flex-col gap-6">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="border rounded-xl p-4 bg-white shadow-sm"
          >
            {/* STATUS BADGE + DATE */}
            <div className="flex justify-between items-center mb-3">
              <span
                className={`px-3 py-1 text-xs rounded-full ${STATUS_COLOR[order.status]}`}
              >
                {order.status_label}
              </span>
              <span className="text-sm text-gray-500">
                Order created: {order.created_at}
              </span>
            </div>

            {/* PRODUCT LIST */}
            <div className="flex flex-col gap-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <Image
                    src={item.image}
                    width={70}
                    height={70}
                    className="rounded"
                    alt={item.name}
                  />
                  <div className="flex flex-col text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500">Variant: {item.variant}</span>
                    <span className="text-gray-500">
                      {item.qty} item x Rp {item.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* INVOICE + TOTAL */}
            <div className="flex justify-between mt-4 text-sm">
              <span className="text-gray-600">{order.invoice}</span>
              <span className="font-semibold">
                Total: Rp {order.total.toLocaleString()}
              </span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-between items-center mt-3">
              <Link
                href={`/account/order-history/${order.id}`}
                className="text-pink-600 text-sm font-medium underline"
              >
                See Transactions detail
              </Link>

              {order.status === "success" && (
                <button className="px-4 py-1 bg-pink-600 text-white rounded-full text-sm">
                  Buy again
                </button>
              )}

              {order.status === "pending" && (
                <button className="px-4 py-1 bg-red-600 text-white rounded-full text-sm">
                  Cancel order
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <p className="text-gray-500">No orders found.</p>
        )}
      </div>
    </div>
  );
}
