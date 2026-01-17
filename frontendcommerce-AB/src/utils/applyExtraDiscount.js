export function applyExtraDiscount(extraDiscount, price) {
  const p = Number(price || 0);
  if (!extraDiscount || !Number.isFinite(p) || p <= 0) return p;

  const valueType = Number(extraDiscount.valueType);
  const value = Number(extraDiscount.value || 0);
  const maxDiscount =
    extraDiscount.maxDiscount === null || extraDiscount.maxDiscount === undefined
      ? null
      : Number(extraDiscount.maxDiscount);

  let disc = 0;

  if (valueType === 2) {
    disc = Math.min(Math.max(0, value), p);
  } else {
    const raw = (p * value) / 100;
    const capped =
      maxDiscount !== null && Number.isFinite(maxDiscount)
        ? Math.min(raw, maxDiscount)
        : raw;
    disc = Math.min(Math.max(0, capped), p);
  }

  return Math.max(0, p - disc);
}
