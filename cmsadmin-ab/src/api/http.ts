import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  // attach token
  const raw = localStorage.getItem("session");
  if (raw) {
    try {
      const session = JSON.parse(raw);
      const token = session?.token;
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
  }

  // ✅ IMPORTANT: jangan paksa JSON kalau FormData
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    // biar axios otomatis set multipart boundary
    if (config.headers) {
      delete (config.headers as any)["Content-Type"];
      delete (config.headers as any)["content-type"];
    }
  } else {
    // request normal JSON
    config.headers = config.headers ?? {};
    (config.headers as any)["Content-Type"] = "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("session");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
