import { getProducts } from "@/services/api/product.services";
import ProductDetailClient from "./ProductDetailClient";

export default async function Page({ params }) {
  const { slug } = params;

  const res = await getProducts({ slug });

  const list = res?.data?.data ?? res?.data ?? [];
  const product =
    list.find((p) => p?.slug === slug || p?.path === slug) || list[0];

  if (!product) return <div>Product not found</div>;

  return <ProductDetailClient product={product} />;
}