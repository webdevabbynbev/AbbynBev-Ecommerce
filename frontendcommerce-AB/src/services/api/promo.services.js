import { getApi } from "./client";

export async function getFlashSale() {
  const json = await getApi(`/flashsale`);
  return json?.serve ?? null;
}
