import { getBrands } from "@/services/api/brands.services";
import { getProducts } from "@/services/api/product.services";
import ProductDetailClient from "./ProductDetailClient";
import BrandDetailClient from "@/app/brand/[slug]/BrandDetailClient";

function toBackendImageUrl(url) {
  if (!url) return "/images/sample-product.jpg";
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
  const product = result.data[0]; // Ambil hasil pertama dari array data

  if (!product) {
    return (
      <div className="container w-full py-16 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <p className="mt-2 text-sm text-gray-500">{productSlug}</p>
      </div>
    );
  }

  const p = result.dataRaw?.[0] || result.data?.[0];

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

  const brandName = p?.brand?.name ?? "";
  const brandSlug = p?.brand?.slug ?? "";

  const normalized = {
    ...p,
    
    brand: brandName, // Tambahkan ini agar variabel brandName di atas terpakai
    brand_id: p?.brand_id,
    brandSlug,

    image: medias?.[0]?.url ?? "/images/sample-product.jpg",
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
