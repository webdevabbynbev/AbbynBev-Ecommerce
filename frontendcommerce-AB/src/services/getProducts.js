export async function getProducts() {
    const res = await fetch (`${process.env.NEXT_PUBLIC_API_URL}/product`, {
        cache:"no-store",
    });

    if (!res.ok) throw new Error("Failed to fetch banners");

  return res.json();
}
