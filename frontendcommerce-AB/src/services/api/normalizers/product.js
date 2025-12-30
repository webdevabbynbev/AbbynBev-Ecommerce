export function normalizeProduct(raw) {
  if (!raw) return null;

  // Bongkar data jika bersarang di dalam 'product' (hasil join ProductOnline)
  const item = raw.product || raw;

  const medias = Array.isArray(item.medias) ? item.medias : [];
  const brandName = item.brand?.name ?? item.brand ?? "";
  const brandSlug =
    item.brand?.slug ?? item.brand_slug ?? item.brandSlug ?? "";

  return {
    ...item, // Tetap simpan properti asli
    id: raw.id || item.id, 
    name: item.name || "Unnamed Product",
    price: Number(item.base_price || item.price || 0),
    image: item.image || medias[0]?.url || "/placeholder.png",
    brand: brandName,
    brandSlug,
    slug: item.slug || item.path || "",
  };
}
