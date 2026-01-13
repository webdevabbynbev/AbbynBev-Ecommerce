import CartClient from "./cartClient";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // pastikan selalu fresh (user-specific)

async function getCart() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${baseUrl}/cart`, {
    headers: {
      cookie: cookieHeader,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const json = await res.json();

  const items = json?.data?.items || json?.data || json?.serve || [];
  return Array.isArray(items) ? items : [];
}

export default async function CartPage() {
  const initialCart = await getCart();
  return <CartClient initialCart={initialCart} />;
}