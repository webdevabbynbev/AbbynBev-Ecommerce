"use client";

import { BtnIcon } from "../button/btnIcon";

export function QuantityInput({
  value,
  min = 1,
  max = 100,
  disabled = false,
  onChange,
}) {
  const clamp = (v) => {
    let n = parseInt(v, 10);
    if (Number.isNaN(n)) n = min;
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
  };

  const qty = clamp(value ?? min);

  const handleChange = (e) => onChange?.(clamp(e.target.value));
  const handleDecrease = () => !disabled && qty > min && onChange?.(qty - 1);
  const handleIncrease = () => !disabled && qty < max && onChange?.(qty + 1);

  return (
    <div className="flex items-center border transition-all ring-1 ring-neutral-200 focus-within:ring-2 focus-within:ring-neutral-300 rounded-full p-2 w-fit h-10 space-x-2">
      <BtnIcon
        iconName="Minus"
        variant="tertiary"
        size="sm"
        onClick={handleDecrease}
        disabled={disabled || qty <= min}
      />

      <input
        type="number"
        value={qty}
        min={min}
        max={max}
        disabled={disabled}
        onChange={handleChange}
        className="w-10 text-center outline-none no-spinner bg-transparent disabled:opacity-50"
      />

      <BtnIcon
        iconName="Plus"
        variant="tertiary"
        size="sm"
        onClick={handleIncrease}
        disabled={disabled || qty >= max}
      />
    </div>
  );
}