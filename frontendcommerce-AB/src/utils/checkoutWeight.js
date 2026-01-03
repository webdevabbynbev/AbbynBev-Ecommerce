import { n } from "./number";

export function calcWeightRounded(items, { fallbackGrams = 200, roundTo = 100 } = {}) {
  const grams = (Array.isArray(items) ? items : []).reduce((sum, item) => {
    const qty = n(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 1, 1);

    const vw = n(item?.variant?.weight ?? 0, 0);
    const pw = n(item?.product?.weight ?? 0, 0);
    const rawW = vw > 0 ? vw : pw;

    const g =
      rawW <= 0 ? fallbackGrams : rawW > 0 && rawW < 1 ? Math.round(rawW * 1000) : Math.round(rawW);

    return sum + qty * g;
  }, 0);

  const safe = Math.max(1, Math.round(grams));
  return Math.max(1, Math.ceil(safe / roundTo) * roundTo);
}
