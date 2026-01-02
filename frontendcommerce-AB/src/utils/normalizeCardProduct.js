import { slugify } from "./slugify";

const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dlrpvteyx/image/upload/v1766202017/placeholder.png";

export function normalizeCardProduct(raw) {
  if (!raw) return null;

  const source = raw.product ?? raw;

  const name =
    source.name ?? source.productName ?? source.title ?? "Unnamed Product";

  const rawPath = typeof source.path === "string" ? source.path : "";
  const pathParts = rawPath.split("/").filter(Boolean);

  // brand slug: dari object brand, atau dari path segmen pertama
  const brandName =
    (source.brand && source.brand.name) ||
    (typeof source.brand === "string" ? source.brand : "") ||
    source.brandName ||
    "";

  const brandSlugCandidate =
    (source.brand && source.brand.slug) ||
    source.brand_slug ||
    source.brandSlug ||
    (pathParts.length ? pathParts[0] : "") ||
    brandName;

  // product slug: source.slug atau segmen terakhir dari path
  const productSlugCandidate =
    source.slug ||
    (pathParts.length ? pathParts[pathParts.length - 1] : "") ||
    name;

  const image =
    source.image ||
    (Array.isArray(source.images) ? source.images[0] : null) ||
    (Array.isArray(source.medias) ? source.medias[0]?.url : null) ||
    PLACEHOLDER_IMAGE;

  const normalized = {
    id: source.id ?? source._id ?? crypto.randomUUID(),
    name,
    price: Number(
      source.price ??
        source.base_price ??
        source.basePrice ??
        source.realprice ??
        source.salePrice ??
        (Array.isArray(source.prices) ? source.prices[0] : undefined) ??
        0
    ),
    compareAt: Number(
      source.realprice ??
        source.oldPrice ??
        (Array.isArray(source.prices) ? source.prices[1] : undefined) ??
        NaN
    ),
    image,
    rating: Number(source.rating ?? source.stars ?? 0),

    brand: brandName,
    brandSlug: slugify(brandSlugCandidate),

    category: source.category ?? source.categoryName ?? "",
    slug: slugify(productSlugCandidate),

    // kamu sudah rename ke is_flash_sale, tapi tetap support yg lama
    sale: Boolean(source.sale ?? source.is_flash_sale ?? source.is_flashsale),
  };

  return normalized;
}
