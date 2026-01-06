import { NextResponse } from "next/server";
import { searchProductsServer } from "@/services/product/search.server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const per_page = Number(searchParams.get("limit") || 4);

    // Validate input
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

    return NextResponse.json(result, {
      headers: {
        "Content-Type": "application/json",
      },
    });
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
