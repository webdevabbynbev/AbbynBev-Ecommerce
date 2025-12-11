"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import Image from "next/image";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]); // selalu array
  const [address, setAddress] = useState(null);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // === LOAD CART ===
  const loadCart = async () => {
    try {
      const res = await axios.get("/cart");
      setCart(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (e) {
      console.log("Error cart:", e);
      setCart([]); // antisipasi error 500 → bikin array kosong
    }
  };

  // === LOAD ADDRESS ===
  const loadAddress = async () => {
    try {
      const res = await axios.get("/addresses");
      const primary = res.data.data.find((a) => a.is_primary === 1);
      setAddress(primary || null);
    } catch (e) {
      console.log("Error address:", e);
      setAddress(null);
    }
  };

  // === SHIPPING METHODS (dummy) ===
  const loadShipping = () => {
    setShippingMethods([
      { id: "jnt", name: "J&T", price: 10800, estimate: "7 - 8 August" },
      { id: "jne", name: "JNE", price: 11200, estimate: "7 - 8 August" },
      { id: "tiki", name: "Tiki", price: 9100, estimate: "7 - 10 August" },
    ]);
  };

  useEffect(() => {
    loadCart();
    loadAddress();
    loadShipping();
  }, []);

  // === TOTAL CALCULATION (AMAN ANTI ERROR) ===
  const safeCart = Array.isArray(cart) ? cart : [];

  const subtotal = safeCart.reduce(
    (sum, item) =>
      sum + (item?.product?.price || 0) * (item?.quantity || 0),
    0
  );

  const total = subtotal + (selectedShipping?.price || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex gap-10">

      {/* ===========================================================
          LEFT SECTION
      ============================================================ */}
      <div className="flex-1 space-y-6">

        {/* ORDER LIST */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-5">Your order</h2>

          {safeCart.length === 0 && (
            <p className="text-gray-400 italic">No products in cart</p>
          )}

          {safeCart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b pb-4 mb-4"
            >
              <div className="flex gap-3 items-center">
                <Image
                  src={item.product.thumbnail}
                  width={60}
                  height={60}
                  alt={item.product.name}
                  className="rounded-md"
                />
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-500">
                    Variant: {item.product.variant_name || "-"}
                  </p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>

              <p className="font-semibold text-pink-600">
                Rp {item.product.price.toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>

        {/* SHIPPING ADDRESS */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Shipping address</h2>

            <button className="px-4 py-2 bg-pink-600 text-white text-sm rounded-lg">
              + Add new address
            </button>
          </div>

          {address ? (
            <p className="text-gray-700 leading-relaxed">
              {address.address}, {address.district}, {address.city},{" "}
              {address.province}, {address.postal_code}
            </p>
          ) : (
            <p className="text-gray-400 italic">No address found</p>
          )}
        </div>

        {/* SHIPPING METHOD */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Shipping method</h2>

          <div className="space-y-3">
            {shippingMethods.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedShipping(m)}
                className={`p-4 rounded-xl border cursor-pointer transition
                  ${
                    selectedShipping?.id === m.id
                      ? "border-pink-600 bg-pink-50"
                      : "hover:border-gray-400"
                  }`}
              >
                <div className="flex justify-between">
                  <p className="font-medium">
                    {m.name} (Rp {m.price.toLocaleString("id-ID")})
                  </p>
                  <p className="text-gray-500 text-sm">{m.estimate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===========================================================
          RIGHT SECTION (PAYMENT + SUMMARY)
      ============================================================ */}
      <div className="w-[360px] bg-white border rounded-2xl shadow-md p-6 h-fit">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Payment</h2>
          <span className="text-sm text-pink-600 font-medium">
            Payment option
          </span>
        </div>

        {/* PAYMENT METHODS */}
        <div className="space-y-5">
          {[
            { name: "BCA virtual account", icon: "/icons/bca.png" },
            { name: "BRI virtual account", icon: "/icons/bri.png" },
            { name: "Mandiri virtual account", icon: "/icons/mandiri.png" },
          ].map((method) => (
            <label
              key={method.name}
              className="flex items-center justify-between w-full cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={method.icon}
                  width={42}
                  height={42}
                  alt={method.name}
                  className="rounded-md"
                />
                <span className="text-[15px] text-gray-800">{method.name}</span>
              </div>

              <input
                type="radio"
                name="payment"
                value={method.name}
                onChange={() => setSelectedPayment(method.name)}
                className="w-5 h-5 accent-pink-600"
              />
            </label>
          ))}
        </div>

        <hr className="my-6 border-gray-200" />

        {/* SUMMARY */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>{safeCart.length} product(s)</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>

          <div className="flex justify-between">
            <span>Shipment:</span>
            <span>
              {selectedShipping
                ? `Rp ${selectedShipping.price.toLocaleString("id-ID")}`
                : "-"}
            </span>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3"></div>

          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-pink-600">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <button className="w-full mt-6 py-3 bg-pink-600 hover:bg-pink-700 transition text-white rounded-full text-center font-semibold text-[16px]">
          Pay now
        </button>
      </div>
    </div>
  );
}
