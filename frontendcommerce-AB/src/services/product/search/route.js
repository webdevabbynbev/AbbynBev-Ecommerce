import { NextResponse } from "next/server";
import { searchProductsServer } from "@/services/product/search.server";

export async function GET(req) {
  try {
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

    const result = await searchProductsServer({ q, page, per_page, brand });
    return NextResponse.json(result, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("[/api/products/search] Error:", err.message);
    return NextResponse.json(
      { data: [], meta: {}, error: err.message || "Search API error" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}