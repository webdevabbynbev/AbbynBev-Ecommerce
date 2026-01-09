import BestSellerClient from "./bestSellerClient";

export const metadata = {
  title: "Best Seller",

  description:
    "Ini dia produk best seller Abby n Bev yang paling sering diburu. Makeup dan skincare favorit yang sudah lolos kurasi beauty store Abby n Bev dan jadi andalan banyak orang.",

  openGraph: {
    title: "Abby n Bev - Makeup & Skincare Terbaik di Indonesia",
    description:
      "Ini dia produk best seller Abby n Bev yang paling sering diburu. Makeup dan skincare favorit yang sudah lolos kurasi beauty store Abby n Bev dan jadi andalan banyak orang.",
    siteName: "Abby n Bev",
    type: "website",
  },
};

export default function BestSeller() {
  return <BestSellerClient />;
}
