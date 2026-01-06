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
  const variants = Array.isArray(item.variants) ? item.variants : [];
  const variantItems = variants
    .map((variant) => {
      if (!variant) return null;
      const attrs = Array.isArray(variant.attributes) ? variant.attributes : [];
      const attrLabel = attrs
        .map(
          (attr) =>
            attr?.attribute_value ||
            attr?.label ||
            attr?.value ||
            attr?.attribute?.name ||
            ""
        )
        .filter(Boolean)
        .join(" / ");
      const fallbackLabel =
        variant?.name || variant?.sku || variant?.code || "";
      return {
        id: variant.id,
        label: attrLabel || fallbackLabel || `Varian ${variant.id}`,
        price: Number(variant.price || item.base_price || item.price || 0),
        stock: Number(variant.stock ?? 0),
      };
    })
    .filter(Boolean);

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
    variantItems,
  };
}
