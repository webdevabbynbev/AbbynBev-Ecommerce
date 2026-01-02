import { getProducts } from "@/services/api/product.services";
import ProductDetailClient from "./ProductDetailClient";
import { slugify } from "@/utils";

const norm = (s) => slugify(decodeURIComponent(String(s || "")).trim());

export default async function Page({ params }) {
  const slugParam = norm(params.slug);

  const res = await getProducts({ per_page: 500, limit: 500, page: 1 });
  const list = Array.isArray(res?.data) ? res.data : [];

  const product = list.find((p) => norm(p?.slug) === slugParam);

  if (!product) return <div>Product not found: {slugParam} (len={list.length})</div>;

  return <ProductDetailClient product={product} />;
}