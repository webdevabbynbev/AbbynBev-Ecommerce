import { getApi, toQuery } from "./client";
import { normalizeProduct } from "./normalizers/product";

export async function getProducts(params = {}) {
  const json = await getApi(`/products${toQuery(params)}`);
  
  const rawRows = json?.serve?.data || []; 
  const normalizedData = rawRows.map(normalizeProduct).filter(Boolean);

  return {
    data: normalizedData,
    dataRaw: rawRows,
    meta: json?.serve || {}
  };
}
export async function getProductByPath(path) {
  if (!path) return { data: null, dataRaw: null };
  const safePath = encodeURIComponent(String(path));
  try {
    const json = await getApi(`/products/${safePath}`);
    const raw = json?.serve || null;
    const normalized = raw ? normalizeProduct(raw) : null;
    return { data: normalized, dataRaw: raw };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not found|404/i.test(message)) {
      return { data: null, dataRaw: null };
    }
    throw error;
  }
}
