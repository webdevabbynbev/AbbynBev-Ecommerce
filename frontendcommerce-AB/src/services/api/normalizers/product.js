export function normalizeProduct(raw) {
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