import { getApi, toQuery } from "./client";
import { normalizeProduct } from "./normalizers/product";

export async function getProducts(params = {}) {
  const json = await getApi(`/products${toQuery(params)}`);

  const rawRows = json?.serve?.data || [];

  // ✅ DEBUG: cek extraDiscount dari backend sebelum normalizer
  try {
    console.log(
      "RAW extraDiscount:",
      rawRows?.[0]?.product?.extraDiscount ?? rawRows?.[0]?.extraDiscount ?? null
    );
  } catch {}

  const normalizedData = rawRows.map(normalizeProduct).filter(Boolean);

  // ✅ DEBUG: cek extraDiscount setelah normalizer
  try {
    console.log("NORM extraDiscount:", normalizedData?.[0]?.extraDiscount ?? null);
  } catch {}

  return {
    data: normalizedData,
    dataRaw: rawRows,
    meta: json?.serve || {},
  };
}

export async function getProductByPath(path) {
  if (!path) return { data: null, dataRaw: null };
  const safePath = encodeURIComponent(String(path));
  try {
    const json = await getApi(`/products/${safePath}`);
    const raw = json?.serve || null;

    // ✅ DEBUG: detail raw
    try {
      console.log("RAW detail extraDiscount:", raw?.extraDiscount ?? raw?.product?.extraDiscount ?? null);
    } catch {}

    const normalized = raw ? normalizeProduct(raw) : null;

    // ✅ DEBUG: detail normalized
    try {
      console.log("NORM detail extraDiscount:", normalized?.extraDiscount ?? null);
    } catch {}

    return { data: normalized, dataRaw: raw };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not found|404/i.test(message)) {
      return { data: null, dataRaw: null };
    }
    throw error;
  }
}
