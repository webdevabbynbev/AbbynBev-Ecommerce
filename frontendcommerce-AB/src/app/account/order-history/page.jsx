"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import Image from "next/image";

// Dummy order data (hanya muncul jika API kosong)
const dummyOrders = [
  {
    id: 1,
    transaction_number: "INV/20250207/ML/834850124",
    status: "arrived",
    created_at: "2025-02-08",
    total_price: 56000,
    items: [
      {
        id: 10,
        product: {
          name: "Milky Way Powder Mask",
          thumbnail: "/images/sample-product.jpg",
          variant_name: "20gr",
          price: 10000,
        },
        quantity: 2,
      },
      {
        id: 20,
        product: {
          name: "Acne Patch",
          thumbnail: "/images/sample-product.jpg",
          variant_name: "10pcs",
          price: 18000,
        },
        quantity: 1,
      },
    ],
  },
];

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");

  const loadOrders = async () => {
    try {
      const res = await axios.get("/transaction");
      const data = res.data?.serve?.data ?? [];

      // Jika API kosong → pakai dummy
      if (data.length === 0) {
        setOrders(dummyOrders);
      } else {
        setOrders(data);
      }
    } catch (err) {
      console.log("Error order:", err);
      setOrders(dummyOrders); // fallback dummy
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // ----- FILTERING -----
  const filterOrders = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "ongoing") return ["pending", "processing", "on_delivery"].includes(o.status);
    if (filter === "success") return ["arrived", "finished"].includes(o.status);
    if (filter === "cancelled") return ["cancelled"].includes(o.status);
    return true;
  });

  // ----- STATUS BADGE -----
  const statusBadgeClass = (status) => {
    switch (status) {
      case "arrived":
      case "finished":
        return "bg-green-100 text-green-600";
      case "pending":
      case "processing":
      case "on_delivery":
        return "bg-yellow-100 text-yellow-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "arrived":
        return "Arrived";
      case "finished":
        return "Completed";
      case "pending":
        return "Awaiting Payment";
      case "processing":
        return "Processing";
      case "on_delivery":
        return "On Delivery";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">

      <h2 className="text-2xl font-semibold mb-8">My Orders</h2>

      {/* FILTER TABS */}
      <div className="flex gap-4 mb-8 border-b pb-4">
        {[
          { key: "all", label: "All" },
          { key: "ongoing", label: "Ongoing" },
          { key: "success", label: "Success" },
          { key: "cancelled", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`pb-2 px-2 text-sm font-medium transition 
              ${
                filter === tab.key
                  ? "text-pink-600 border-b-2 border-pink-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ORDER LIST */}
      {filterOrders.length === 0 ? (
        <p className="text-gray-400 text-center py-20 italic">No orders found</p>
      ) : (
        filterOrders.map((order) => (
          <div key={order.id} className="bg-white border rounded-xl p-6 shadow-sm mb-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <span className={`px-3 py-1 text-sm rounded-full ${statusBadgeClass(order.status)}`}>
                {statusLabel(order.status)}
              </span>
              <p className="text-xs text-gray-500">
                Order created:{" "}
                {new Date(order.created_at).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Items */}
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-4 border-b pb-4 mb-4">
                <Image
                  src={item.product.thumbnail}
                  alt={item.product.name}
                  width={70}
                  height={70}
                  className="rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-gray-500 text-sm">
                    Variant: {item.product.variant_name || "-"}
                  </p>
                  <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                </div>
                <p className="text-pink-600 font-semibold">
                  Rp {item.product.price.toLocaleString("id-ID")}
                </p>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between font-semibold text-lg mt-2">
              <span>Total Payment:</span>
              <span className="text-pink-600">
                Rp {order.total_price.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button className="text-pink-600 underline text-sm">
                See Transaction Details
              </button>
              <button className="px-4 py-2 bg-pink-600 text-white text-sm rounded-lg">
                Buy Again
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
