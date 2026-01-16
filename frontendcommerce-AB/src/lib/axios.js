import axios from "axios";
import { clearToken } from "@/services/authToken";

const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || "";
const normalizedBaseURL = rawBaseURL
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");
const baseURL = normalizedBaseURL;

if (!baseURL) {
  console.warn("NEXT_PUBLIC_API_URL is not set");
}

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers.Accept = "application/json";

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (!isFormData && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    return res;
  },
  (err) => {
    if (err?.response?.status === 401) {
      clearToken();
      // if (typeof window !== "undefined") {
      //   const path = window.location.pathname;
      //   const hasUser = Boolean(localStorage.getItem("user"));
      //   const isAuthPage =
      //     path === "/login" ||
      //     path === "/register" ||
      //     path.startsWith("/auth") ||
      //     path === "/sign-in";

      //   if (!isAuthPage && hasUser) {
      //     if (path !== "/") {
      //       window.location.href = "/";
      //       return new Promise(() => {});
      //     }
      //   }
      // }
    }
    return Promise.reject(err);
  }
);

export default api;
