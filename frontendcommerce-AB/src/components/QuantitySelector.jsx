"use client";

import { useState } from "react";
import { BtnIcon } from "./BtnIcon"; // sesuaikan path

export function QuantityInput({ min = 1, max = 100, onChange }) {
  const [qty, setQty] = useState(min);

  const handleChange = (e) => {
    let value = parseInt(e.target.value, 10);

    if (isNaN(value)) value = min;
    if (value < min) value = min;
    if (value > max) value = max;

    setQty(value);
    onChange?.(value);
  };

  const handleDecrease = () => {
    if (qty > min) {
      const newQty = qty - 1;
      setQty(newQty);
      onChange?.(newQty);
    }
  };

  const handleIncrease = () => {
    if (qty < max) {
      const newQty = qty + 1;
      setQty(newQty);
      onChange?.(newQty);
    }
  };

  return (
    <div className="flex items-center border transition-all ring-1 ring-neutral-200 focus:ring-2 focus:ring-neutral-300 rounded-full p-2 w-fit h-10 space-x-2">
      {/* minBtn */}
      <BtnIcon
        iconName="Minus"
        variant="tertiary"
        size="sm"
        onClick={handleDecrease}
        disabled={qty <= min}
      />

      {/* Input number */}
      <input
        type="number"
        value={qty}
        min={min}
        max={max}
        onChange={handleChange}
        className="w-8 text-center outline-none no-spinner"
      />

      {/* PlusBtn */}
      <BtnIcon
        iconName="Plus"
        variant="tertiary"
        size="sm"
        onClick={handleIncrease}
        disabled={qty >= max}
      />
    </div>
  );
}
