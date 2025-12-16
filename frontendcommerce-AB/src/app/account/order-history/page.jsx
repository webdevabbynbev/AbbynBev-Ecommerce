"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";


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
      setOrders(data.length === 0 ? dummyOrders : data);
    } catch (err) {
      console.log("Error order:", err);
      setOrders(dummyOrders);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);


  const filterOrders = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "ongoing")
      return ["pending", "processing", "on_delivery"].includes(o.status);
    if (filter === "success")
      return ["arrived", "finished"].includes(o.status);
    if (filter === "cancelled") return ["cancelled"].includes(o.status);
    return true;
  });

 
  const getStatusInfo = (status) => {
    switch (status) {
      case "arrived":
      case "finished":
        return {
          bgColor: "bg-green-50",
          textColor: "text-green-600",
          message: "Your order has arrived!",
          icon: "✓",
        };
      case "pending":
        return {
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-700",
          message: "Waiting for admin to confirm your order",
          icon: "",
        };
      case "processing":
        return {
          bgColor: "bg-blue-50",
          textColor: "text-blue-600",
          message: "Your order is being processed",
          icon: "⚙",
        };
      case "on_delivery":
        return {
          bgColor: "bg-purple-50",
          textColor: "text-purple-600",
          message: "Your order is on the way",
          icon: "",
        };
      case "cancelled":
        return {
          bgColor: "bg-red-50",
          textColor: "text-red-600",
          message: "Order has been cancelled",
          icon: "✕",
        };
      default:
        return {
          bgColor: "bg-gray-50",
          textColor: "text-gray-600",
          message: "Order status unknown",
          icon: "•",
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-1">
              <Link
                href="/account"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span>Profile management</span>
              </Link>

              <Link
                href="/account/wishlist"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span>Wishlist</span>
              </Link>

              <Link
                href="/account/order-history"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-pink-600 bg-pink-50 rounded-lg font-medium"
              >
                <span>Order History</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Order history
          </h2>

          {/* Filter Tabs */}
          <div className="flex gap-3 mb-6">
            {[
              { key: "all", label: "All" },
              { key: "ongoing", label: "Ongoing" },
              { key: "success", label: "Success" },
              { key: "cancelled", label: "Cancelled" },
            ].map((tab) => (
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
          </div>

          {/* Order List */}
          {filterOrders.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filterOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-200 rounded-lg p-5"
                  >
                    {/* Status Message */}
                    <div
                      className={`${statusInfo.bgColor} ${statusInfo.textColor} px-4 py-2.5 rounded-md flex items-center justify-between mb-4`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{statusInfo.icon}</span>
                        <span className="text-sm font-medium">
                          {statusInfo.message}
                        </span>
                      </div>
                      <div className="text-xs">
                        Order created:{" "}
                        {new Date(order.created_at)
                          .toLocaleDateString("en-GB")
                          .replace(/\//g, "/")}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-4 mb-4">
                      {order.items.map((item) => (
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
                              {item.product.price.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        {order.transaction_number}
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Total</p>
                          <p className="text-base font-bold text-gray-900">
                            {order.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            )}{" "}
                            item: Rp
                            {order.total_price.toLocaleString("id-ID")}
                          </p>
                        </div>

                        <Link
                          href={`/account/order-history/${encodeURIComponent(
                            order.transaction_number
                          )}`}
                          className="px-5 py-2 text-xs font-medium text-white bg-pink-600 rounded-full hover:bg-pink-700 transition-colors"
                        >
                          See Transactions detail
                        </Link>

                        <button className="px-5 py-2 text-xs font-medium text-pink-600 bg-white border border-pink-600 rounded-full hover:bg-pink-50 transition-colors">
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
