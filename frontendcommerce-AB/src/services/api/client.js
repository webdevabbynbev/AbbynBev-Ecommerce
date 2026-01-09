const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const BASE = API_BASE
  ? API_BASE.endsWith("/")
    ? API_BASE
    : `${API_BASE}/`
  : "";

export async function getApi(path, options = {}) {
  if (!BASE) throw new Error("NEXT_PUBLIC_API_URL belum di-set. Cek .env");

  const cleanPath = String(path).replace(/^\/+/, ""); // penting
  const url = path.startsWith("http")
    ? path
    : new URL(cleanPath, BASE).toString();

  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    // Add credentials for cross-origin requests if running server-side
    ...(typeof window === "undefined" && { credentials: "include" }),
  });

  // Check if response is JSON before parsing
  const contentType = res.headers.get("content-type");
  let data = {};

  if (contentType?.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    // If not JSON, try to parse text as fallback
    const text = await res.text().catch(() => "");
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
  }

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
