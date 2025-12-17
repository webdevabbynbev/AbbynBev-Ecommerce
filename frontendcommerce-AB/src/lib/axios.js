import axios from "axios";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

if (!baseURL) {
  // biar kelihatan kalau env belum kebaca
  console.warn("NEXT_PUBLIC_API_URL is not set");
}

const api = axios.create({
  baseURL,
  withCredentials: false, // ✅ biasanya tidak perlu kalau pakai Bearer token
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers.Accept = "application/json";

  // ✅ Attach token kalau ada
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ Default Content-Type JSON, kecuali FormData (upload)
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (!isFormData && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

export default api;
