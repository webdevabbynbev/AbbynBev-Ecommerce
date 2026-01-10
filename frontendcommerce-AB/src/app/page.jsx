import HomeClient from "./homeClient";

export const metadata = {
  title: "Abby n Bev | Situs Belanja Online Makeup dan Skincare Terbaik Di Indonesia",

  description:
    "Abby n Bev itu gak cuma beauty store dan toko kosmetik *yang *jual makeup dan skincare. Di sini kamu bisa konsultasi dengan AI Beauty Advisor gratis, jadi belanja nggak asal viral—lebih tepat & aman buat kulit kamu.",

  openGraph: {
    title: "Abby n Bev - Makeup & Skincare Terbaik di Indonesia",
    description:
      "Abby n Bev bukan sekadar beauty store. Konsultasi gratis dengan AI Beauty Advisor untuk menemukan makeup dan skincare yang sesuai dengan kondisi kulit kamu.",
    siteName: "Abby n Bev",
    type: "website",
  },
};

export default function Home() {
  return <HomeClient />;
}
