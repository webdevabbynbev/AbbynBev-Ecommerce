const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function fetchJson(url, options = {}) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL belum di-set. Cek .env");

  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

function normalizeProduct(raw) {
  if (!raw) return null;

  const medias = Array.isArray(raw.medias) ? raw.medias : [];
  const brandName = raw.brand?.name ?? raw.brand ?? raw.brandName ?? "";
  const categoryName = raw.categoryType?.name ?? raw.category ?? "";

  const price =
    raw.price ??
    raw.basePrice ??
    (typeof raw.base_price !== "undefined" ? raw.base_price : undefined) ??
    0;

  return {
    ...raw,
    price: Number(price) || 0,
    image: raw.image || medias?.[0]?.url || "/placeholder.png",
    brand: brandName,
    category: categoryName,
    path: raw.path || null,
    slug: raw.slug || null,
    averageRating:
      Number(raw.avg_rating ?? raw.averageRating ?? 0) ||
      (Array.isArray(raw.reviews) && raw.reviews.length
        ? raw.reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / raw.reviews.length
        : 0),
    totalReview: Number(raw.review_count ?? raw.totalReview ?? raw.reviews?.length ?? 0) || 0,
  };
}

export async function getProducts(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, String(v));
  });

  const url = `${API_BASE}/products${usp.toString() ? `?${usp}` : ""}`;
  const json = await fetchJson(url);

  // backend kamu return ProductOnline[] (row.product)
  const serve = json?.serve;
  const rows = Array.isArray(serve?.data) ? serve.data : [];
  const products = rows.map((r) => normalizeProduct(r?.product ?? r)).filter(Boolean);

  const meta = {
    total: serve?.total,
    perPage: serve?.perPage,
    currentPage: serve?.currentPage,
    lastPage: serve?.lastPage,
  };

  return { data: products, meta };
}

export async function getProductByPath(path) {
  const safePath = Array.isArray(path) ? path.join("/") : path;
  const json = await fetchJson(`${API_BASE}/products/${safePath}`);
  return normalizeProduct(json?.serve);
}

export async function getBrands(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, String(v));
  });

  const url = `${API_BASE}/brands${usp.toString() ? `?${usp}` : ""}`;
  const json = await fetchJson(url);
  return Array.isArray(json?.serve) ? json.serve : [];
}

export async function getBrandBySlug(slug) {
  const json = await fetchJson(`${API_BASE}/brands/${slug}`);
  const brand = json?.serve || null;
  if (brand?.products) brand.products = brand.products.map(normalizeProduct).filter(Boolean);
  return brand;
}

export async function getFlashSale() {
  const json = await fetchJson(`${API_BASE}/flashsale`);
  return json?.serve ?? null;
}
