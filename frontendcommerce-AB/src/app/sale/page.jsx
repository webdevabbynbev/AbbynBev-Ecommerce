import SaleClient from "./saleClient";

export const metadata = {
  title: "Sale",

  description:
    "Waktunya checkout! Nikmati promo dan diskon makeup dan skincare di toko kosmetik Abby n Bev. Produk favorit dengan harga lebih hemat, tapi tetap sesuai kebutuhan kulit kamu.",

  openGraph: {
    title: "Abby n Bev - Makeup & Skincare Terbaik di Indonesia",
    description:
      "Waktunya checkout! Nikmati promo dan diskon makeup dan skincare di toko kosmetik Abby n Bev. Produk favorit dengan harga lebih hemat, tapi tetap sesuai kebutuhan kulit kamu.",
    siteName: "Abby n Bev",
    type: "website",
  },
};

export default function SalePage() {
  return <SaleClient />;
}
