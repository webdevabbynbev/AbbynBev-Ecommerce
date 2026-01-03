import { NextResponse } from "next/server";
import { searchProductsServer } from "@/services/product/search.server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();
  const page = Number(searchParams.get("page") || 1);
  const per_page = Number(searchParams.get("limit") || 24);

  // samakan key dengan Filter kamu (aku support beberapa)
  const brand =
    searchParams.get("brand") ||
    searchParams.get("brands") ||
    searchParams.get("brand_id") ||
    "";

  try {
    const result = await searchProductsServer({ q, page, per_page, brand });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { data: [], meta: {}, error: "Search API error" },
      { status: 500 }
    );
  }
}
