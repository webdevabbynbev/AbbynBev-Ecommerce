import { BevPick } from "@/data";
import { DataReview } from "@/data";

export function getProductsWithReviews() {
  return BevPick.map((product) => {
    const reviews = DataReview.filter((r) => r.productId === product.id);

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      ...product,
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReview: reviews.length,
    };
  });
}
