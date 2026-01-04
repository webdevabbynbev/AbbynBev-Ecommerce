import { getApi, toQuery } from "./client";

export async function getCategories(params = {}) {
  const qs = toQuery({ page: 1, per_page: 50, ...params });
  return getApi(`/category-types${qs}`);
}