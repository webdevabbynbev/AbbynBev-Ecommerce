import { getApi } from "./client";

export async function getBanners() {
  return getApi("/banners");
}