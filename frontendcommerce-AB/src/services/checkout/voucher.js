import axios from "@/lib/axios";
import { unwrap } from "@/utils/unwrap";

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.serve)) return payload.serve;
  if (Array.isArray(payload?.vouchers)) return payload.vouchers;
  return [];
}

function normalizeVoucherList(list) {
  return (Array.isArray(list) ? list : []).map((row) => {
    const v = row?.voucher ?? row;
    return {
      ...v,
      // kalau response claim ada extra info:
      claimId: row?.id ?? row?.claimId ?? null,
      claimStatus: row?.status ?? row?.claimStatus ?? null,
    };
  });
}

export async function fetchAvailableVouchers() {
  const res = await axios.get("/vouchers/available");
  const payload = unwrap(res);
  const arr = pickArray(payload);
  return normalizeVoucherList(arr);
}

export async function fetchMyVouchers() {
  const res = await axios.get("/vouchers/my");
  const payload = unwrap(res);
  const arr = pickArray(payload);
  return normalizeVoucherList(arr);
}

export async function claimVoucher(voucherId) {
  const res = await axios.post(`/vouchers/${voucherId}/claim`);
  return unwrap(res);
}
