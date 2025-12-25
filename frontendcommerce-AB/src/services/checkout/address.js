import axios from "@/lib/axios";
import { unwrap } from "@/utils/unwrap";

export async function fetchAddresses() {
  const res = await axios.get("/addresses");
  const payload = unwrap(res);

  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.serve)
    ? payload.serve
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  return Array.isArray(arr) ? arr : [];
}

export async function setMainAddress(id) {
  await axios.put("/addresses", { id, is_active: 2 });
}

/**
 * ✅ Biteship replacement for RajaOngkir province/city
 * Backend route: GET /areas?input=...&countries=ID&type=single
 * Response: { serve: [...] }
 */
export async function searchAreas(input, opts = {}) {
  const params = {
    input: String(input || "").trim(),
    countries: opts.countries || "ID",
    type: opts.type || "single", // "single" default sesuai controller
  };

  const res = await axios.get("/areas", { params });
  const payload = unwrap(res);

  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.serve)
    ? payload.serve
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  return Array.isArray(arr) ? arr : [];
}

/**
 * ⚠️ Legacy RajaOngkir functions (dipakai hook lama)
 * Karena backend sudah migrasi ke Biteship, endpoint /province & /city tidak ada.
 * Biar tidak error/crash, kita return [].
 * TODO: ubah UI agar pakai searchAreas() dan field biteship_area_name.
 */
export async function fetchProvinces() {
  return [];
}

export async function fetchCities(provinceId) {
  return [];
}
