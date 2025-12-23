import { getApi, toQuery } from "./client";
import { normalizeProduct } from "./normalizers/product";

export async function getProducts(params = {}) {
  const json = await getApi(`/products${toQuery(params)}`);

  const serve = json?.serve;
  const rows = Array.isArray(serve?.data) ? serve.data : [];
  const products = rows
    .map((r) => normalizeProduct(r?.product ?? r))
    .filter(Boolean);

  return {
    data: products,
    meta: {
      total: serve?.total,
      perPage: serve?.perPage,
      currentPage: serve?.currentPage,
      lastPage: serve?.lastPage,
    },
  };
}