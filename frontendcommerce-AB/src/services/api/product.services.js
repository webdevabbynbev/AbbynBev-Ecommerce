import { getApi, toQuery } from "./client";
import { normalizeProduct } from "./normalizers/product";

export async function getProducts(params = {}) {
  const json = await getApi(`/products${toQuery(params)}`);
  
  // Ambil data dari 'serve'
  const rawRows = json?.serve?.data || []; 
  
  // Petakan ke normalizer
  const normalizedData = rawRows.map(normalizeProduct).filter(Boolean);

  return {
    data: normalizedData,
    meta: json?.serve || {}
  };
}
