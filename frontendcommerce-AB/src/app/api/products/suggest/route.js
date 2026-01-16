import { NextResponse } from "next/server";
import { searchProductsServer } from "@/services/product/search.server";
import { getProducts } from "@/services/api/product.services";
import { slugify } from "@/utils";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const per_page = Number(searchParams.get("limit") || 4);
    const needle = q.toLowerCase();

    if (!q) {
      return NextResponse.json(
        { data: [], meta: {} },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await searchProductsServer({
      q,
      page: 1,
      per_page,
      fetch_size: 100,
    });

    const brandSource = await getProducts({ page: 1, per_page: 500 });
    const baseProducts =
      (result?.data || []).length > 0
        ? result.data
        : brandSource?.data || [];
    const filteredProducts = baseProducts.filter((item) => {
      const name = (item?.name || "").toString().toLowerCase();
      const sku = (item?.sku || "").toString().toLowerCase();
      const brandName = (
        item?.brand?.name ??
        item?.brand?.brandname ??
        item?.brand ??
        ""
      )
        .toString()
        .toLowerCase();
      const brandSlug = (
        item?.brand?.slug ??
        item?.brand_slug ??
        ""
      )
        .toString()
        .toLowerCase();
      const matches =
        needle.length === 1
          ? name.startsWith(needle) ||
            brandName.startsWith(needle) ||
            brandSlug.startsWith(needle) ||
            sku.startsWith(needle)
          : name.includes(needle) ||
            brandName.includes(needle) ||
            brandSlug.includes(needle) ||
            sku.includes(needle);
      return matches;
    });

    const brandMap = new Map();
    (brandSource?.data || []).forEach((item) => {
      const brandName =
        item?.brand?.name ?? item?.brand?.brandname ?? item?.brand ?? "";
      if (!brandName) return;
      const brandSlug =
        item?.brand?.slug ?? item?.brand_slug ?? slugify(brandName);
      const normalizedName = brandName.toString().toLowerCase();
      const normalizedSlug = brandSlug.toLowerCase();
      const brandMatch =
        needle.length === 1
          ? normalizedName.startsWith(needle) ||
            normalizedSlug.startsWith(needle)
          : normalizedName.includes(needle) ||
            normalizedSlug.includes(needle);
      if (!brandMatch) return;
      const brandId = item?.brand_id ?? item?.brandId ?? item?.brand?.id ?? "";
      const key = (brandSlug || brandName || brandId).toString();
      if (!key || brandMap.has(key)) return;
      brandMap.set(key, {
        name: brandName,
        slug: brandSlug,
        id: brandId,
      });
    });
    
    return NextResponse.json(
      {
        ...result,
        data: filteredProducts.slice(0, per_page),
        meta: {
          ...(result?.meta || {}),
          total: filteredProducts.length,
        },
        brands: Array.from(brandMap.values()),
      },
      {
      headers: {
        "Content-Type": "application/json",
      },
    })
    ;

  } catch (err) {
    console.error("[/api/products/suggest] Error:", err.message);
    return NextResponse.json(
      { data: [], meta: {}, error: err.message || "Suggest API error" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
