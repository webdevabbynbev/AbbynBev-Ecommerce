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
