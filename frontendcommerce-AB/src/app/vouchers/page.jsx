"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { n } from "@/utils/number";

import {
  fetchAvailableVouchers,
  fetchMyVouchers,
  claimVoucher,
} from "@/services/checkout/voucher";

function formatDateId(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function voucherTypeLabel(v) {
  const type = Number(v?.type);
  return type === 2 ? "Gratis/Ongkir" : "Diskon Belanja";
}

function voucherValueLabel(v) {
  const isPct = Number(v?.isPercentage) === 1;
  const type = Number(v?.type);
  const maxDisc = n(v?.maxDiscPrice, 0);

  if (isPct) {
    const pct = n(v?.percentage, 0);
    if (type === 2) {
      return `${pct}% ongkir (maks Rp ${maxDisc.toLocaleString("id-ID")})`;
    }
    return `${pct}% (maks Rp ${maxDisc.toLocaleString("id-ID")})`;
  }

  const nominal = n(v?.price, 0);
  return type === 2
    ? `Potong ongkir Rp ${nominal.toLocaleString("id-ID")}`
    : `Potong belanja Rp ${nominal.toLocaleString("id-ID")}`;
}

function VoucherCard({ v, rightSlot }) {
  const expired = formatDateId(v?.expiredAt);

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="font-semibold truncate">
          {v?.name || v?.title || v?.code || `Voucher #${v?.id}`}
        </div>

        <div className="text-sm text-gray-600 mt-1">
          <span className="inline-block mr-2 px-2 py-1 text-xs rounded-full bg-gray-100">
            {voucherTypeLabel(v)}
          </span>
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-pink-50 text-pink-700">
            {voucherValueLabel(v)}
          </span>
        </div>

        <div className="text-xs text-gray-500 mt-2 space-x-3">
          {!!v?.code && <span>Kode: <b>{v.code}</b></span>}
          {expired && <span>Exp: {expired}</span>}
          {typeof v?.qty !== "undefined" && <span>Stok: {n(v.qty, 0)}</span>}
        </div>
      </div>

      {rightSlot}
    </div>
  );
}

export default function VouchersPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from"); // optional: "checkout"
  const { user } = useAuth();

  const [tab, setTab] = useState("available");
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [err, setErr] = useState("");

  const mineIds = useMemo(() => new Set(mine.map((x) => x?.id).filter(Boolean)), [mine]);

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const [a, m] = await Promise.all([fetchAvailableVouchers(), fetchMyVouchers()]);
      setAvailable(Array.isArray(a) ? a : []);
      setMine(Array.isArray(m) ? m : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Gagal load voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    loadAll();
  }, [user]);

  const onClaim = async (id) => {
    try {
      await claimVoucher(id);
      await loadAll();
      alert("Voucher berhasil di-claim ");
      setTab("my");
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Gagal claim voucher");
    }
  };

  const onUse = (v) => {
    // simpan voucher terpilih untuk checkout
    try {
      localStorage.setItem("checkout_voucher", JSON.stringify(v));
    } catch {}
    router.push("/checkout");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Voucher</div>
          <div className="text-sm text-gray-600">
            Claim voucher dulu.
          </div>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="px-4 py-2 rounded-full border hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {!!err && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded-xl p-3 text-sm">
          {err}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="my">My Vouchers</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-3 mt-4">
          {available.length === 0 && !loading ? (
            <div className="text-gray-500 italic">Tidak ada voucher tersedia.</div>
          ) : null}

          {available.map((v) => {
            const outOfStock = n(v?.qty, 0) <= 0;
            const alreadyMine = mineIds.has(v?.id);

            return (
              <VoucherCard
                key={v?.id}
                v={v}
                rightSlot={
                  <button
                    disabled={loading || outOfStock || alreadyMine}
                    onClick={() => onClaim(v.id)}
                    className="shrink-0 px-4 py-2 rounded-full bg-pink-600 text-white disabled:opacity-50"
                  >
                    {alreadyMine ? "Claimed" : outOfStock ? "Habis" : "Claim"}
                  </button>
                }
              />
            );
          })}
        </TabsContent>

        <TabsContent value="my" className="space-y-3 mt-4">
          {mine.length === 0 && !loading ? (
            <div className="text-gray-500 italic">Kamu belum claim voucher.</div>
          ) : null}

          {mine.map((v) => (
            <VoucherCard
              key={v?.id}
              v={v}
              rightSlot={
                <button
                  onClick={() => onUse(v)}
                  className="shrink-0 px-4 py-2 rounded-full border border-pink-600 text-pink-700 hover:bg-pink-50"
                >
                  Pakai di Checkout
                </button>
              }
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
