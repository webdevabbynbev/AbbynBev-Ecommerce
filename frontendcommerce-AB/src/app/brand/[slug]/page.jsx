import { getBrandBySlug } from "@/services/api/brands.services";
import BrandDetailClient from "./BrandDetailClient";
import { notFound } from "next/navigation";

export async function generateMetadata(props) {
  const params = await props.params;
  const brandData = await getBrandBySlug(params.slug);

  if (!brandData) {
    return {
      title: "Brand Tidak Ditemukan",
      description: "Brand yang kamu cari tidak tersedia",
    };
  }

  return {
    title: `${brandData.brandname} | Official Brand Store`,
    description:
      brandData.profile ||
      `Koleksi produk ${brandData.brandname} dengan harga terbaik dan original.`,
    alternates: {
      canonical: `/brand/${brandData.slug}`,
    },
    openGraph: {
      title: brandData.brandname,
      description: brandData.profile,
      url: `/brand/${brandData.slug}`,
      images: [
        {
          url: `/${brandData.logo}`,
          width: 800,
          height: 800,
          alt: brandData.brandname,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brandData.brandname,
      description: brandData.profile,
      images: [`/${brandData.logo}`],
    },
  };
}

export default async function BrandDetailPage(props) {
  const params = await props.params;
  const brandData = await getBrandBySlug(params.slug);

  if (!brandData) {
    notFound();
  }

  return <BrandDetailClient brandData={brandData} />;
}
