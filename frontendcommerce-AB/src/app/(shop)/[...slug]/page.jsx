import { getBrands } from "@/services/api/brands.services";
import { getProducts } from "@/services/api/product.services";
import ProductDetailClient from "./ProductDetailClient";
import BrandDetailClient from "@/app/brand/[slug]/BrandDetailClient";

function toBackendImageUrl(url) {
  if (!url)
    return "https://res.cloudinary.com/dlrpvteyx/image/upload/v1766202017/placeholder.png";
  if (url.startsWith("http")) return url;

  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";
  return `${base}${url}`;
}

export default async function Page({ params }) {
  const { slug } = await params;
  
  if (slug.length === 1) {
  const brandSlug = slug[0];
  const brands = await getBrands({ slug: brandSlug });
  const brandInfo = brands[0]; 

  if (!brandInfo) return <div>Brand Not Found</div>;

  const brandProducts = await getProducts({ brand: brandSlug });

  const dataForClient = {
    ...brandInfo,
    products: brandProducts.data || []
  };

  return <BrandDetailClient brandData={dataForClient} />;
}

  // 2. LOGIKA HALAMAN PRODUK (Jika slug 2 segment atau lebih, misal: /emina/sun-battle)
  const productSlug = slug[slug.length - 1];

  // Gunakan fungsi getProducts dengan filter slug produk
  const result = await getProducts({ slug: productSlug });
  const product =
    result.data.find((item) => item.slug === productSlug || item.path === productSlug) ||
    result.data[0];

  if (!product) {
    return (
      <div className="container w-full py-16 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <p className="mt-2 text-sm text-gray-500">{productSlug}</p>
      </div>
    );
  }

  const rawRow =
    result.dataRaw?.find((item) => {
      const rawItem = item?.product || item;
      return rawItem?.slug === productSlug || rawItem?.path === productSlug;
    }) ||
    result.dataRaw?.[0] ||
    product;
  const p = rawRow?.product || rawRow;

  const medias = (p?.medias ?? []).map((m) => ({
    ...m,
    url: toBackendImageUrl(m.url),
  }));

  const rawVariants =
    p?.variants ?? p?.productVariants ?? p?.product_variants ?? [];
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

  const brandName = p?.brand?.name ?? p?.brand ?? product?.brand ?? "";
  const brandSlug =
    p?.brand?.slug ??
    p?.brandSlug ??
    p?.brand_slug ??
    product?.brandSlug ??
    "";

  const normalized = {
    ...p,
    
    brand: brandName, // Tambahkan ini agar variabel brandName di atas terpakai
    brand_id: p?.brand_id,
    brandSlug,
    name: p?.name ?? product?.name ?? "Unnamed Product",
    slug: p?.slug ?? p?.path ?? product?.slug ?? "",

    image:
      medias?.[0]?.url ??
      "https://res.cloudinary.com/dlrpvteyx/image/upload/v1766202017/placeholder.png",
    images: medias.map((m) => m.url),

    medias,

    realprice: basePrice,
    price: basePrice, // belum ada discount → samain dulu
    sale: Boolean(p?.is_flashsale),
    

    variant_value: variantItems.length ? "Variant" : "",
    variant: variantItems.map((v) => v.label),
    variantItems,

    stock: stockTotal,
  };

  return <ProductDetailClient product={normalized} />;
}
