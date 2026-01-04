export function normalizeProduct(raw) {
  if (!raw) return null;

  const item = raw.product || raw;

  const medias = Array.isArray(item.medias) ? item.medias : [];
  const brandName =
    item.brand?.name ??
    item.brand?.brandname ??
    item.brand_name ??
    item.brandName ??
    item.brand ??
    item.brandname ??
    "";
  const brandSlug = item.brand?.slug ?? item.brand_slug ?? item.brandSlug ?? "";

  return {
    ...item,
    id: raw.id || item.id,
    name: item.name || "Unnamed Product",
    price: Number(
      item.base_price ??
        item.basePrice ??
        item.price ??
        item.salePrice ??
        item.realprice ??
        0
    ),
    image:
      item.image ||
      medias[0]?.url ||
      "https://res.cloudinary.com/dlrpvteyx/image/upload/v1766202017/placeholder.png",
    brand: brandName,
    brandSlug,
    category:
      item.categoryType?.name ??
      item.category_type?.name ??
      item.category?.name ??
      item.category?.categoryname ??
      item.category_name ??
      item.categoryName ??
      item.category ??
      item.categoryname ??
      "",
    slug: item.slug || item.path || "",
  };
}
