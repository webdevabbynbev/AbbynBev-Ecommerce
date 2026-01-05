import { getProductByPath, getProducts } from "@/services/api/product.services";
import ProductDetailClient from "./ProductDetailClient";
import { slugify } from "@/utils";

const norm = (s) => slugify(decodeURIComponent(String(s || "")).trim());

export default async function Page({ params }) {
  const awaitedParams = await params;
  const slugParam = norm(awaitedParams.slug);

  const resByPath = await getProductByPath(slugParam);
  let product = resByPath?.data || null;

  if (!product) {
    const res = await getProducts({ per_page: 500, limit: 500, page: 1 });
    const list = Array.isArray(res?.data) ? res.data : [];
    product = list.find((p) => norm(p?.slug) === slugParam) || null;
  }

  if (!product) {
    return <div>Product not found: {slugParam}</div>;
  }

  return <ProductDetailClient product={product} />;
}