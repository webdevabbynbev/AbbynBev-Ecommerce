export async function getProductByPath(path) {
  const safePath = Array.isArray(path) ? path.join("/") : path;

  const encodedPath = String(safePath)
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/products/${encodedPath}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;

  const json = await res.json();
  return json?.serve ? normalizeProduct(json.serve) : null;
}