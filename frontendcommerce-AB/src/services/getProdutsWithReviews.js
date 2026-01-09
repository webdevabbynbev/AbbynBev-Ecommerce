import { BevPick,DataReview } from "@/data";
export function getProductsWithReviews() {
  return BevPick.map((product) => {
    const reviews = DataReview.filter((r) => r.productID === product.id);

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const slug =
      product.slug ??
      (product.name || product.productName
        ? (product.name || product.productName)
            .toLowerCase()
            .replace(/\s+/g, "-")
        : `item-${product.id}`);

    return {
      ...product,
      slug, // <---- penting
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReview: reviews.length,
    };
  });
}
