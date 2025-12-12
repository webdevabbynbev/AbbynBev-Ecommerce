"use client";

import { useRouter, useParams } from "next/navigation";
import Image from "next/image";


const STEPS = [
  { key: "created", label: "Order created" },
  { key: "packaged", label: "Packaged" },
  { key: "on_delivery", label: "On delivery" },
  { key: "completed", label: "Order complete" },
];


const BASE_DUMMY_ORDER = {
  transactionNumber: "2015080418",
  statusLabel: "On Delivery",
  shipping: {
    orderDate: "August 1, 2025",
    deliveryDate: "August 3, 2025",
    estimatedDelivery: "August 7, 2025",
    courier: "JNE",
  },
  address: {
    name: "Abby Bev",
    line1:
      "Kota Bandung, Pasirwangi Ruko Sasakawa No. 38, RT 04/RW 05, Bojongsoang, Kec. Sayang, patokan Abby n Bev store",
    line2: "Kabupaten Bandung Barat, Jawa Barat",
    phone: "+62857xxxxxxx",
  },
  items: [
    {
      id: 1,
      name: "Milky way powder mask 20gr",
      variant: "20gr",
      qty: 2,
      price: 20000,
      image: "/images/sample-product.jpg",
    },
    {
      id: 2,
      name: "Acne patch mix 18",
      variant: "18pcs",
      qty: 1,
      price: 36800,
      image: "/images/sample-product.jpg",
    },
  ],
 
  subtotal: 56800,
  serviceCharges: 0,
  shipmentFee: 10800,
  total: 67600,
};

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();


  const transactionNumberFromUrl = params?.id
    ? decodeURIComponent(params.id)
    : null;

  const order = {
    ...BASE_DUMMY_ORDER,
    transactionNumber:
      transactionNumberFromUrl || BASE_DUMMY_ORDER.transactionNumber,
  };


  const currentStep = 2;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => router.push("/account/order-history")}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ← Back to My Order
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Order Tracking
      </h1>

      {/* STEP BAR */}
      <div className="bg-white border border-pink-100 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((step, index) => {
            const isDone = index < currentStep;
            const isCurrent = index === currentStep;
            const isLast = index === STEPS.length - 1;

            return (
              <div
                key={step.key}
                className="flex-1 flex items-center min-w-0"
              >
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
                      (isDone || isCurrent
                        ? "text-pink-600"
                        : "text-gray-400")
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

      {/* MAIN CARD */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Order Detail
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Order ID: {order.transactionNumber}
            </p>
          </div>

          <div className="text-right space-y-1">
            <p className="text-xs text-gray-500">
              No pesanan: {order.transactionNumber}
            </p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-600">
              {order.statusLabel}
            </span>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="border border-gray-100 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Shipping
          </h3>
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
              <p className="text-gray-800">{order.shipping.courier}</p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border border-gray-100 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Shipping Address
          </h3>
          <div className="text-xs text-gray-700 space-y-1">
            <p className="font-medium">{order.address.name}</p>
            <p>{order.address.line1}</p>
            <p>{order.address.line2}</p>
            <p>{order.address.phone}</p>
          </div>
        </div>

        {/* Items */}
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
                Rp {item.price.toLocaleString("id-ID")}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-100 pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal Product</span>
            <span className="font-medium text-gray-900">
              Rp {order.subtotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">service charges</span>
            <span className="font-medium text-gray-900">
              Rp {order.serviceCharges.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Shipment</span>
            <span className="font-medium text-gray-900">
              Rp {order.shipmentFee.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-dashed border-gray-200 mt-2">
            <span className="text-base font-semibold text-gray-900">
              Total
            </span>
            <span className="text-base font-bold text-pink-600">
              Rp {order.total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
