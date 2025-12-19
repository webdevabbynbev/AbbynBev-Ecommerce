console.log("API PRODUCT")
export async function getProducts(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, String(v));
  });

  const url = `${process.env.NEXT_PUBLIC_API_URL}}/products${usp.toString() ? `?${usp}` : ""}`;
  const json = await fetch(url);
  const serve = json?.serve;
  const rows = Array.isArray(serve?.data) ? serve.data : [];
  const products = rows.map((r) => normalizeProduct(r?.product ?? r)).filter(Boolean);

  const meta = {
    total: serve?.total,
    perPage: serve?.perPage,
    currentPage: serve?.currentPage,
    lastPage: serve?.lastPage,
  };

  return { data: products, meta };
}