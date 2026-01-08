import { getApi } from "./client";

export async function getFlashSale() {
  const json = await getApi(`/flashsale`);
  return json?.serve ?? null;
}

export async function getSale() {
  const json = await getApi(`/sale`);
  return json?.serve ?? null;
}