import HomeClient from "./homeClient";

export const metadata = {
  title:
    "Abby n Bev | Situs Belanja Online Makeup dan Skincare Terbaik Di Indonesia",
  template: "%s | Abby n Bev",
  description:
    "Lebih dari sekedar Beauty Store atau Toko Kosmetik, di Abby n Bev kamu bisa konsultasi gratis bersama AI Beauty Advisor buat tahu jenis kulit, skintone, undertone, biar belanja makeup dan skincare nggak salah pilih",
  openGraph: {
    title: "Home",
    description:
      "Abby n Bev itu gak cuma beauty store dan toko kosmetik yang jual makeup dan skincare. Di sini kamu bisa konsultasi dengan AI Beauty Advisor gratis, jadi belanja nggak asal viral—lebih tepat & aman buat kulit kamu.",
    // url: "https://abbybev.com",
    siteName: "Abby n Bev",
    type: "website",
  },
};

export default function Home() {
  return <HomeClient />;
}
