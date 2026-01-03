import { getBrandBySlug } from "@/services/api/brands.services";
import BrandDetailClient from "./BrandDetailClient";

export default async function BrandDetailPage({ params }) {
  const { slug } = await params;
  const brandData = await getBrandBySlug(slug);
  

  if (!brandData) {
    return <div className="p-4">Brand tidak ditemukan</div>;
  }

  return <BrandDetailClient brandData={brandData} />;
}
