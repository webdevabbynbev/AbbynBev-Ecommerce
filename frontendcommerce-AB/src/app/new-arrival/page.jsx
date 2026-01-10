import NewArrivalClient from "./newArrivalClient";

export const metadata = {
  title: "New Arrival",

  description:
    "Produk baru sudah ready di beauty store Abby n Bev! Dari makeup sampai skincare terbaru yang siap kamu coba sebelum jadi viral.",

  openGraph: {
    title: "Abby n Bev - Makeup & Skincare Terbaik di Indonesia",
    description:
      "Produk baru sudah ready di beauty store Abby n Bev! Dari makeup sampai skincare terbaru yang siap kamu coba sebelum jadi viral.",
    siteName: "Abby n Bev",
    type: "website",
  },
};

export default function NewArrivalPage() {
  return <NewArrivalClient />;
}
