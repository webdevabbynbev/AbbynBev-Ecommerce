import axios from "axios";
import { getToken, refreshTokenTtl, clearToken } from "@/services/authToken";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

if (!baseURL) {
  console.warn("NEXT_PUBLIC_API_URL is not set");
}

const api = axios.create({
  baseURL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers.Accept = "application/json";

  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (!isFormData && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    refreshTokenTtl(); // 🔄 sliding expiration
    return res;
  },
  (err) => {
    if (err?.response?.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const isAuthPage =
          path === "/login" || path === "/register" || path.startsWith("/auth");

        if (!isAuthPage) {
          // gunakan replace supaya tidak nambah history dan tidak "bounce"
          window.location.replace("/login");
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
