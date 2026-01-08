import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",
  withCredentials: true,
});

// OPTIONAL: kalau pakai token auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // atau dari cookie
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getApi<T = any>(url: string, config = {}) {
  const res = await api.get<T>(url, config);
  return res.data;
}

export async function postApi<T = any>(
  url: string,
  data?: any,
  config = {}
) {
  const res = await api.post<T>(url, data, config);
  return res.data;
}

export async function putApi<T = any>(
  url: string,
  data?: any,
  config = {}
) {
  const res = await api.put<T>(url, data, config);
  return res.data;
}

export async function deleteApi<T = any>(url: string, config = {}) {
  const res = await api.delete<T>(url, config);
  return res.data;
}
