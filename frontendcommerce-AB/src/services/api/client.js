const API_BASE = process.env.NEXT_PUBLIC_API_URL;
<<<<<<< HEAD

export async function getApi(path, options = {}) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL belum di-set. Cek .env");

  const url = path.startsWith("http")
    ? path
    : new URL(path.startsWith("/") ? path : `/${path}`, API_BASE).toString();
=======
const BASE = API_BASE ? (API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`) : "";

export async function getApi(path, options = {}) {
  if (!BASE) throw new Error("NEXT_PUBLIC_API_URL belum di-set. Cek .env");

  const cleanPath = String(path).replace(/^\/+/, ""); // penting
  const url = path.startsWith("http") ? path : new URL(cleanPath, BASE).toString();
>>>>>>> origin/main

  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });

  const data = await res.json().catch(() => ({}));
<<<<<<< HEAD
  if (!res.ok)
    throw new Error(data?.message || `Request failed: ${res.status}`);
=======
  if (!res.ok) throw new Error(data?.message || `Request failed: ${res.status}`);
>>>>>>> origin/main
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
