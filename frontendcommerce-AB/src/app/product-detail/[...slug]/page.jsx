import ProductDetailClient from "./ProductDetailClient";

function toBackendImageUrl(url) {
  if (!url) return "/images/sample-product.jpg";
  if (url.startsWith("http")) return url;

  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";
  return `${base}${url}`;
}

export default async function ProductDetail({ params }) {
  const slugArr = params?.slug ?? [];
  const segments = Array.isArray(slugArr) ? slugArr : [String(slugArr)];

  // slug produk = segmen terakhir
  const productSlug = segments[segments.length - 1] || "";

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api/v1";

  const res = await fetch(`${apiUrl}/products/${encodeURIComponent(productSlug)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="container w-full py-16 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <p className="mt-2 text-sm text-gray-500">{productSlug}</p>
      </div>
    );
  }

  const json = await res.json();
  const p = json?.serve;

  const medias = (p?.medias ?? []).map((m) => ({
    ...m,
    url: toBackendImageUrl(m.url),
  }));

  const rawVariants = p?.variants ?? p?.productVariants ?? p?.product_variants ?? [];
  const variantItems = rawVariants.map((v, i) => ({
    id: v.id ?? i,
    label: v.name ?? v.sku ?? v.barcode ?? `Variant ${i + 1}`,
    price: Number(v.price ?? p?.basePrice ?? p?.base_price ?? 0),
    stock: Number(v.stock ?? 0),
  }));

  const basePrice = Number(p?.basePrice ?? p?.base_price ?? 0);

  const stockTotal = variantItems.length
    ? variantItems.reduce((s, v) => s + (Number(v.stock) || 0), 0)
    : Number(p?.stock ?? 0);

  const brandName = p?.brand?.name ?? "";
  const brandSlug = p?.brand?.slug ?? "";

  const normalized = {
    ...p,
    brand: brandName,
    brandSlug,

    image: medias?.[0]?.url ?? "/images/sample-product.jpg",
    images: medias.map((m) => m.url),

    medias,

 
    realprice: basePrice,
    price: basePrice, // belum ada discount → samain dulu
    sale: false,

    variant_value: variantItems.length ? "Variant" : "",
    variant: variantItems.map((v) => v.label),
    variantItems,

    
    stock: stockTotal,
  };

  return <ProductDetailClient product={normalized} />;
}