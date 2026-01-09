export function getDiscountPercent(realprice, price) {
  if (!realprice || !price || realprice <= price) return null;
  return Math.round(((realprice - price) / realprice) * 100);
}
