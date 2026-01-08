import { getApi, toQuery } from "./client";

export async function getFlashSale() {
  const json = await getApi("/flashsale");
  return json ?? null;
}

export async function getSale() {
  const json = await getApi("/sale");
  return json ?? null;
}
export async function getSales() {
  const json = await getApi(`/sales${toQuery()}`);
  return json ?? null;
}