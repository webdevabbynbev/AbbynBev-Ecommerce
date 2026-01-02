import { NextResponse } from "next/server";
import { searchProductsServer } from "@/services/product/search.server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const per_page = Number(searchParams.get("limit") || 4);

  try {
    const result = await searchProductsServer({
      q,
      page: 1,
      per_page,
      fetch_size: 100,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { data: [], meta: {}, error: "Suggest API error" },
      { status: 500 }
    );
  }
}