/**
 * Server-side API client untuk menghindari CORB issues
 * Digunakan di Server Components dan Route Handlers
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const BASE = API_BASE
  ? API_BASE.endsWith("/")
    ? API_BASE
    : `${API_BASE}/`
  : "";

/**
 * Server-side fetch dengan proper headers untuk menghindari CORB
 */
export async function getApiServer(path, options = {}) {
  if (!BASE) throw new Error("NEXT_PUBLIC_API_URL belum di-set. Cek .env");

  const cleanPath = String(path).replace(/^\/+/, "");
  const url = path.startsWith("http")
    ? path
    : new URL(cleanPath, BASE).toString();

  try {
    const body =
      options.body &&
      typeof options.body === "object" &&
      !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body;

    const res = await fetch(url, {
      method: options.method || "GET",
      cache: "no-store",
      ...options,
      body,
      headers: {
        Accept: "application/json",
        ...(options.method && options.method !== "GET"
          ? { "Content-Type": "application/json" }
          : {}),
        "User-Agent": "NextJS-Frontend/1.0",
        ...(options.headers || {}),
      },
    });

    const contentType = res.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await res.json();
    } else if (contentType.includes("text/")) {
      const text = await res.text();
      // Try parse as JSON if possible
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.warn(
          `[ServerClient] Response text not JSON: ${text.substring(0, 100)}`
        );
        data = { error: "Invalid response format" };
      }
    } else {
      // Unknown content type
      const text = await res.text();
      console.warn(`[ServerClient] Unknown content-type: ${contentType}`);
      data = {};
    }

    if (!res.ok) {
      const errorMsg =
        data?.message || data?.error || `Request failed: ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[ServerClient] API Error: ${error.message}`, { url, path });
    throw error;
  }
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
