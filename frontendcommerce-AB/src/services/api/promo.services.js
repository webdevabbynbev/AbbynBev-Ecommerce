import { getApi } from "./client";

export async function getFlashSale() {
  const json = await getApi(`/flashsale`);
  return json?.serve ?? null;
}

export async function getSale() {
  const json = await getApi(`/sale`);
  return json ?? null;
  
}
export async function getSales() {
  return api.get("/sales"); // base sudah /api/v1
}