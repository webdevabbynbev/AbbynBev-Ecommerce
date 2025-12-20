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

export async function fetchProvinces() {
  const res = await axios.get("/province");
  const list = unwrap(res) || [];
  return Array.isArray(list) ? list : [];
}

export async function fetchCities(provinceId) {
  const res = await axios.get("/city", { params: { province: provinceId } });
  const list = unwrap(res) || [];
  return Array.isArray(list) ? list : [];
}
