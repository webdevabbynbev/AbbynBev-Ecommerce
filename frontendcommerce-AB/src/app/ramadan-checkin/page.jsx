"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import axios from "@/lib/axios";

const TOTAL_DAYS = 30;
const CHECKIN_QUOTES = [
  "Setiap langkah kecil hari ini membawa berkah besar esok hari.",
  "Kebaikan yang konsisten akan membentuk kebiasaan baik.",
  "Ramadan adalah tentang keteguhan dan niat yang tulus.",
  "Semangat hari ini adalah hadiah untuk dirimu di akhir Ramadan.",
];

const RECOMMENDED_PRODUCTS = [
  {
    title: "Wardah Lightening Facial Wash",
    price: "Rp 35.000",
  },
  {
    title: "Skintific 5X Ceramide Barrier Moisturizer",
    price: "Rp 129.000",
  },
  {
    title: "Somethinc Low pH Gentle Jelly Cleanser",
    price: "Rp 89.000",
  },
];

export default function RamadanCheckinPage() {
  const today = new Date();
  const todayValue = format(today, "yyyy-MM-dd");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exemptSubmitting, setExemptSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [status, setStatus] = useState({
    checkedDates: [],
    checkedCount: 0,
    hasCheckedToday: false,
    hasExemptToday: false,
    exemptDates: [],
    exemptCount: 0,
    rewardEligible: false,
    totalDays: TOTAL_DAYS,
  });
  const [selectedReason, setSelectedReason] = useState("sakit");
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [successModal, setSuccessModal] = useState({
    open: false,
    title: "",
    quote: "",
  });

  const isSelectedChecked = status.checkedDates.includes(selectedDate);
  const isSelectedExempt = status.exemptDates.some(
    (row) => row.date === selectedDate
  );

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const leadingEmpty = Array.from({ length: getDay(start) });
    return { days, leadingEmpty };
  }, [currentMonth]);

  const loadStatus = async () => {
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");
    try {
      const res = await axios.get("/ramadan/checkin/status");
      const serve = res?.data?.serve || {};
      setStatus({
        checkedDates: serve.checked_dates || [],
        checkedCount: serve.checked_count || 0,
        hasCheckedToday: Boolean(serve.has_checked_today),
        hasExemptToday: Boolean(serve.has_exempt_today),
        exemptDates: serve.exempt_dates || [],
        exemptCount: serve.exempt_count || 0,
        rewardEligible: Boolean(serve.reward_eligible),
        totalDays: serve.total_days || TOTAL_DAYS,
      });
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Gagal memuat status check-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (isSelectedChecked || isSelectedExempt || submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    setInfoMsg("");
    try {
      const res = await axios.post("/ramadan/checkin", {
        date: selectedDate,
      });
      const serve = res?.data?.serve || {};
      setInfoMsg(res?.data?.message || "Check-in berhasil.");
      setSuccessModal({
        open: true,
        title: "Check-in berhasil 🎉",
        quote: CHECKIN_QUOTES[Math.floor(Math.random() * CHECKIN_QUOTES.length)],
      });
      setStatus((prev) => ({
        ...prev,
        checkedCount: serve.checked_count ?? prev.checkedCount,
        rewardEligible: Boolean(serve.reward_eligible ?? prev.rewardEligible),
        hasCheckedToday: true,
      }));
      await loadStatus();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Check-in gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExempt = async () => {
    if (isSelectedChecked || isSelectedExempt || exemptSubmitting) return;
    setExemptSubmitting(true);
    setErrorMsg("");
    setInfoMsg("");
    try {
      const res = await axios.post("/ramadan/checkin/exempt", {
        reason: selectedReason,
        date: selectedDate,
      });
      setInfoMsg(res?.data?.message || "Exempt berhasil.");
      setSuccessModal({
        open: true,
        title: "Status tersimpan ✅",
        quote: CHECKIN_QUOTES[Math.floor(Math.random() * CHECKIN_QUOTES.length)],
      });
      await loadStatus();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Exempt gagal.");
    } finally {
      setExemptSubmitting(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {successModal.title}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {successModal.quote}
                </p>
              </div>
              <button
                onClick={() =>
                  setSuccessModal({ open: false, title: "", quote: "" })
                }
                className="text-gray-400 hover:text-gray-600"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-pink-50 p-4">
              <p className="text-sm font-semibold text-pink-700">
                Rekomendasi produk untukmu
              </p>
              <div className="mt-3 space-y-3">
                {RECOMMENDED_PRODUCTS.map((product) => (
                  <div
                    key={product.title}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.title}
                      </p>
                      <p className="text-xs text-gray-500">{product.price}</p>
                    </div>
                    <button className="text-xs font-semibold text-pink-600 hover:text-pink-700">
                      Lihat
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() =>
                setSuccessModal({ open: false, title: "", quote: "" })
              }
              className="mt-6 w-full rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
            >
              Oke, lanjut
            </button>
          </div>
        </div>
      )}
      <div className="rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-amber-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-pink-600">
          Ramadan Challenge
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">Ramadan Check-in</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl">
          Kumpulkan check-in harian selama Ramadan untuk mendapatkan reward di akhir.
          Tandai juga hari exempt jika sedang sakit, perjalanan, atau periode.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <p className="text-gray-400">Memuat status check-in...</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {status.checkedCount}/{status.totalDays} hari
                </div>
                <p className="text-xs text-gray-500">
                  Target harian check-in & exempt
                </p>
              </div>
              {isSelectedChecked ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Sudah check-in di tanggal ini
                </span>
              ) : isSelectedExempt ? (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Tanggal ini di-exempt
                </span>
              ) : (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Belum check-in di tanggal ini
                </span>
              )}
              {status.rewardEligible && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Reward siap diklaim 🎉
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded">
                {errorMsg}
              </div>
            )}
            {infoMsg && (
              <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded">
                {infoMsg}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Pilih tanggal check-in</p>
                    <p className="text-base font-semibold text-gray-900">
                      {format(currentMonth, "MMMM yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="h-9 w-9 rounded-full border bg-white text-sm hover:bg-gray-50"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="h-9 w-9 rounded-full border bg-white text-sm hover:bg-gray-50"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                    <div key={day} className="text-center">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.leadingEmpty.map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-11" />
                  ))}
                  {calendarDays.days.map((day) => {
                    const value = format(day, "yyyy-MM-dd");
                    const isSelected = value === selectedDate;
                    const isOutsideMonth = !isSameMonth(day, currentMonth);
                    const isChecked = status.checkedDates.includes(value);
                    const isExempt = status.exemptDates.some((row) => row.date === value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedDate(value)}
                        className={`h-11 rounded-xl border text-sm font-medium transition ${
                          isSelected
                            ? "bg-pink-600 text-white border-pink-600 shadow-sm"
                            : isChecked
                            ? "bg-green-100 text-green-700 border-green-200"
                            : isExempt
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        } ${isOutsideMonth ? "opacity-40" : ""}`}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-200" />
                    Check-in
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-200" />
                    Exempt
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-pink-500" />
                    Dipilih
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleCheckin}
                  disabled={isSelectedChecked || isSelectedExempt || submitting}
                  className={`w-full sm:w-auto px-6 py-2 rounded-lg text-white font-medium ${
                  isSelectedChecked || isSelectedExempt || submitting
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-pink-600 hover:bg-pink-700"
                }`}
              >
                {isSelectedChecked
                  ? "Sudah Check-in di Tanggal Ini"
                  : isSelectedExempt
                  ? "Tanggal Ini Di-exempt"
                  : submitting
                  ? "Memproses..."
                  : "Check-in Hari Ini"}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {["sakit", "perjalanan", "haid"].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      selectedReason === reason
                        ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                        : "bg-white border-gray-200 text-gray-600"
                    }`}
                  >
                    {reason === "haid" ? "Periode" : reason}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExempt}
                disabled={isSelectedChecked || isSelectedExempt || exemptSubmitting}
                className={`w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-medium border ${
                  isSelectedChecked || isSelectedExempt || exemptSubmitting
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100"
                }`}
              >
                {exemptSubmitting ? "Menyimpan..." : "Exempt Hari Ini"}
              </button>
              </div>
            </div>

            {status.checkedDates.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Riwayat check-in:
                </p>
                <div className="flex flex-wrap gap-2">
                  {status.checkedDates.map((date) => (
                    <span
                      key={date}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {date}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {status.exemptDates.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Riwayat exempt:
                </p>
                <div className="flex flex-wrap gap-2">
                  {status.exemptDates.map((row) => (
                    <span
                      key={`${row.date}-${row.reason}`}
                      className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200"
                    >
                      {row.date} · {row.reason === "haid" ? "Periode" : row.reason}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Ringkasan</p>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Total check-in</span>
                <span className="font-semibold text-gray-900">{status.checkedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total exempt</span>
                <span className="font-semibold text-gray-900">{status.exemptCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hari terpilih</span>
                <span className="font-semibold text-gray-900">
                  {format(new Date(selectedDate), "dd MMM yyyy")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Tips Ramadan</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>Atur jadwal check-in di waktu yang sama setiap hari.</li>
              <li>Gunakan exempt jika sedang sakit atau perjalanan.</li>
              <li>Lengkapi 30 hari untuk reward spesial.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}