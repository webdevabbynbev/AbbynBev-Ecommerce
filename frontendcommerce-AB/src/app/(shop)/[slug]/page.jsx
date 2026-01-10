import { getProductByPath, getProducts } from "@/services/api/product.services";
import ProductDetailClient from "./ProductDetailClient";
import { slugify } from "@/utils";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const slugParam = norm(params.slug);
  const resByPath = await getProductByPath(slugParam);
  const product = resByPath?.data;

  if (!product) return {};

  const title = `${product.name} | Abby n Bev`;
  const description =
    product.shortDescription ??
    product.description?.slice(0, 160) ??
    `Beli ${product.name} original di Abby n Bev.`;

  const image =
    product.image || (Array.isArray(product.images) ? product.images[0] : null);

  return {
    title,
    description,

    alternates: {
      canonical: `/product/${product.slug}`,
    },

    openGraph: {
      title,
      description,
      type: "website",
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: product.name,
            },
          ]
        : [],
    },
  };
}

const norm = (s) => slugify(decodeURIComponent(String(s || "")).trim());

export default async function Page({ params }) {
  const awaitedParams = await params;
  const slugParam = norm(awaitedParams.slug);

  const resByPath = await getProductByPath(slugParam);
  let product = resByPath?.data || null;

  if (!product) {
    const res = await getProducts({ per_page: 500, limit: 500, page: 1 });
    const list = Array.isArray(res?.data) ? res.data : [];
    product = list.find((p) => norm(p?.slug) === slugParam) || null;
  }

  if (!product) notFound();

  return (
    <>
      <h1 className="sr-only">{product.name}</h1>
      <ProductDetailClient product={product} />
    </>
  );
}
