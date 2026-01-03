const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getApi(path, options = {}) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL belum di-set. Cek .env");

  const url = path.startsWith("http")
    ? path
    : new URL(path.startsWith("/") ? path : `/${path}`, API_BASE).toString();

  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data?.message || `Request failed: ${res.status}`);
  return data;
}

export function toQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}
