import api from "@/lib/axios";

const API_BASE = (
  api.defaults.baseURL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).trim();
const FILE_HOST = API_BASE.replace(/\/api(\/v\d+)?\/?$/i, ""); // → http://localhost:3333

export function getImageUrl(path) {
  if (!path) return "/placeholder.png"; // fallback kalau kosong
  if (/^https?:\/\//i.test(path)) return path; // sudah absolute URL
  return `${FILE_HOST}/${path.replace(/^\/+/, "")}`; // relative → gabung
}
