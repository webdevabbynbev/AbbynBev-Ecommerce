import { getApi, toQuery } from "./client";
import { normalizeProduct } from "./normalizers/product";

export async function getBrands(params = {}) {
  const json = await getApi(`/brands${toQuery(params)}`);
  return Array.isArray(json?.serve) ? json.serve : [];
}

export async function getBrandBySlug(slug) {
  const safeSlug = encodeURIComponent(String(slug || ""));
  const json = await getApi(`/brands/${safeSlug}`);

  const brand = json?.serve || null;
  if (brand?.products) {
    brand.products = brand.products.map(normalizeProduct).filter(Boolean);
  }
  return brand;
}