import SearchResultsClient from "./searchResultClient";
import { searchProductsServer } from "@/services/product/search.server";
import { getBrands } from "@/services/api/brands.services";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams; // ✅ wajib

  const q = (sp?.q || "").trim();

  const brand = sp?.brand || sp?.brands || sp?.brand_id || "";

  const page = Number(sp?.page || 1);
  const limit = Number(sp?.limit || 24);

  const resBrands = await getBrands();
  const brands = resBrands?.data || [];

  if (!q) {
    // tetap render layout + filter, tapi tanpa hasil
    return (
      <SearchResultsClient
        initialQ=""
        initialProducts={[]}
        initialMeta={{}}
        brands={brands}
        itemsPerPage={24}
      />
    );
  }

  const { data: initialProducts, meta: initialMeta } =
    await searchProductsServer({
      q,
      page: Number(sp?.page || 1),
      limit: Number(sp?.limit || 24),
      brand,
    });

  return (
    <SearchResultsClient
      initialQ={q}
      initialProducts={initialProducts}
      initialMeta={initialMeta}
      brands={brands}
      itemsPerPage={24}
    />
  );
}
