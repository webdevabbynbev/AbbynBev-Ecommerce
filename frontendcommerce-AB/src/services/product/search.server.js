import { getProducts } from "@/services/api/product.services";

function normLower(v) {
  return (v ?? "").toString().toLowerCase();
}

function getBrandId(p) {
  return (
    p?.brand_id ??
    p?.brandId ??
    p?.brand?.id ??
    null
  );
}

/**
 * q: string
 * page: number
 * per_page: number
 * brand: string | string[] | null  (id atau slug; support multi via comma)
 */
export async function searchProductsServer({
  q,
  page = 1,
  per_page = 24,
  fetch_size = 120,
  brand = null,
} = {}) {
  const keyword = (q || "").trim();
  if (!keyword) return { data: [], meta: { page, per_page, total: 0, total_pages: 1 } };

  const needle = keyword.toLowerCase();

  // normalize brand filter (support comma separated)
  const brandListRaw = Array.isArray(brand)
    ? brand
    : typeof brand === "string"
      ? brand.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const brandSet = new Set(brandListRaw.map((b) => b.toString()));

  const res = await getProducts({
    page: 1,
    // ambil banyak lalu filter manual (karena backend sering fallback)
    per_page: Math.max(per_page, fetch_size),
  });

  const rows = Array.isArray(res?.data) ? res.data : [];

  const filtered = rows
    .filter((p) => {
      // keyword filter
      const name = normLower(p?.name);
      const brandName = normLower(p?.brand);
      const sku = normLower(p?.sku);

      const okKeyword =
        name.includes(needle) || brandName.includes(needle) || sku.includes(needle);

      if (!okKeyword) return false;

      // brand filter (kalau ada)
      if (brandSet.size === 0) return true;

      const bid = getBrandId(p);
      const bslug = p?.brand?.slug ?? p?.brand_slug ?? null;
      const bname = p?.brand ?? p?.brand?.name ?? null;

      // cocokkan ke beberapa kemungkinan field
      return (
        (bid != null && brandSet.has(bid.toString())) ||
        (bslug && brandSet.has(bslug.toString())) ||
        (bname && brandSet.has(bname.toString()))
      );
    });

  // paging dari hasil filtered
  const start = (page - 1) * per_page;
  const end = start + per_page;

  return {
    data: filtered.slice(start, end),
    meta: {
      page,
      per_page,
      total: filtered.length,
      total_pages: Math.max(1, Math.ceil(filtered.length / per_page)),
    },
  };
}