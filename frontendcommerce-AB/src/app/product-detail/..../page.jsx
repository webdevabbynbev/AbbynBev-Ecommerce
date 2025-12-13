import { getProductsWithReviews } from "@/services";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetail({ params }) {
  const { slug } = params;
  const products = getProductsWithReviews();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return (
      <div className="container w-full py-16 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
      </div>
    );
  }
  return <ProductDetailClient products={products} product={product} />;
}
