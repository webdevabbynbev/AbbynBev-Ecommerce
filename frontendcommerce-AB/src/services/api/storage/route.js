import { NextResponse } from "next/server";

const DEFAULT_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const key = String(body?.key || "").trim();
    const value = String(body?.value ?? "");
    const maxAge = body?.maxAge;

    if (!key) {
      return NextResponse.json({ message: "Key wajib diisi." }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(key, value, {
      ...DEFAULT_OPTIONS,
      ...(Number.isFinite(Number(maxAge)) ? { maxAge: Number(maxAge) } : {}),
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Gagal menyimpan cookie." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = String(searchParams.get("key") || "").trim();

  if (!key) {
    return NextResponse.json({ message: "Key wajib diisi." }, { status: 400 });
  }

  const value = request.cookies.get(key)?.value ?? null;
  return NextResponse.json({ value });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const key = String(searchParams.get("key") || "").trim();

  if (!key) {
    return NextResponse.json({ message: "Key wajib diisi." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(key, "", { ...DEFAULT_OPTIONS, maxAge: 0 });
  return response;
}