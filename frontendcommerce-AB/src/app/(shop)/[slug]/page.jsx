import { getProductByPath } from "@/services/api/product.services";
import ProductDetailClient from "./ProductDetailClient";

export default async function Page({ params }) {
 const slugParam = decodeURIComponent(String(params.slug || "")).trim();

    const res = await getProductByPath(slugParam);
  const product = res?.data || null;


   if (!product) return <div>Product not found: {slugParam}</div>;

  return <ProductDetailClient product={product} />;
}