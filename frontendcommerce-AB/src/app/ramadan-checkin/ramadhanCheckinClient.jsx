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
import { Wheel } from "react-custom-roulette";
// Import Icon untuk Popup
import { X, ShoppingBag, ChevronRight } from "lucide-react";

// ... (Kode Data Produk & Spin Modal Tetap Sama) ...
const RECOMMENDED_PRODUCTS = [
  { title: "Wardah Lightening Facial Wash", price: "Rp 35.000" },
  { title: "Skintific 5X Ceramide Moisturizer", price: "Rp 129.000" },
  { title: "Somethinc Low pH Jelly Cleanser", price: "Rp 89.000" },
];

const SPIN_DATA = [
  {
    option: "Voucher 50%",
    style: { backgroundColor: "#F87171", textColor: "white" },
  },
  {
    option: "Free Ongkir",
    style: { backgroundColor: "#FBBF24", textColor: "black" },
  },
  {
    option: "Produk Gratis",
    style: { backgroundColor: "#34D399", textColor: "white" },
  },
  {
    option: "Poin 10rb",
    style: { backgroundColor: "#60A5FA", textColor: "white" },
  },
  { option: "Zonk", style: { backgroundColor: "#9CA3AF", textColor: "white" } },
  {
    option: "Diskon 20%",
    style: { backgroundColor: "#A78BFA", textColor: "white" },
  },
];

const TOTAL_DAYS = 30;
const MAX_EXEMPT_DAYS = 21; // Batas maksimal tidak puasa
const CHECKIN_QUOTES = [
  "Setiap langkah kecil hari ini membawa berkah besar esok hari.",
  "Kebaikan yang konsisten akan membentuk kebiasaan baik.",
];

// --- KOMPONEN POPUP PROMO BARU ---
const PromoPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const promoProducts = [
    {
      id: 1,
      name: "Ramadan Glow Bundle",
      price: "Rp 150.000",
      discount: "20%",
    },
    {
      id: 2,
      name: "Hydrating Set",
      price: "Rp 120.000",
      discount: "15%",
    },
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Popup */}
        <div className="relative h-32 bg-linear-to-r from-pink-600 to-purple-500 flex flex-col items-center justify-center text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h3 className="text-2xl font-bold mb-1"> ✨ Penawaran Spesial ✨</h3>
          <p className="text-pink-50 text-sm">
            Khusus untuk menemani Ramadanmu
          </p>
        </div>

        {/* Body Popup (List Produk) */}
        <div className="p-5 space-y-4">
          {promoProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-gray-50"
            >
              <div className="h-14 w-14 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs font-bold">
                IMG
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-pink-600 font-bold text-sm">
                    {product.price}
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                    {product.discount} OFF
                  </span>
                </div>
              </div>
              <button className="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                <ShoppingBag size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Popup */}
        <div className="p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Lanjut Check-in
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ... (Komponen RecommendationList, SpinWheelModal, OfferModal SAMA SEPERTI SEBELUMNYA) ...
const RecommendationList = () => (
  <div className="mt-2 text-left animate-slide-up">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">✨</span>
      <p className="text-sm font-bold text-gray-800">
        Rekomendasi Spesial Hari Ini
      </p>
    </div>
    <div className="space-y-2">
      {RECOMMENDED_PRODUCTS.map((product, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between bg-white border border-pink-100 px-3 py-2 rounded-xl shadow-sm hover:shadow-md transition"
        >
          <div>
            <p className="text-xs font-semibold text-gray-900">
              {product.title}
            </p>
            <p className="text-[10px] text-pink-600 font-bold">
              {product.price}
            </p>
          </div>
          <button className="text-[10px] font-bold text-white bg-pink-500 px-3 py-1.5 rounded-lg hover:bg-pink-600 transition">
            Beli
          </button>
        </div>
      ))}
    </div>
  </div>
);

const SpinWheelModal = ({ open, onClose }) => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showResult, setShowResult] = useState(false);

  if (!open) return null;

  const handleSpinClick = () => {
    if (mustSpin) return;
    const newPrizeNumber = Math.floor(Math.random() * SPIN_DATA.length);
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
    setShowResult(false);
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    setShowResult(true);
  };

  const resetAndClose = () => {
    setShowResult(false);
    setMustSpin(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center relative overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-pink-500 via-purple-500 to-amber-500"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Putar Keberuntungan!
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          Terima kasih sudah berjuang! Putar rodanya!
        </p>

        <div className="mb-6 scale-90 sm:scale-100 pointer-events-none">
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={SPIN_DATA}
            onStopSpinning={handleStopSpinning}
            backgroundColors={["#3e3e3e", "#df3428"]}
            textColors={["#ffffff"]}
            outerBorderColor="#eeeeee"
            outerBorderWidth={5}
            innerRadius={20}
            innerBorderColor="#30261a"
            innerBorderWidth={0}
            radiusLineColor="#eeeeee"
            radiusLineWidth={1}
            fontSize={16}
          />
        </div>

        {showResult ? (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-10 animate-fade-in p-6">
            <div className="text-6xl mb-4 animate-bounce">🎁</div>
            <h3 className="text-xl font-bold text-gray-800">Selamat!</h3>
            <p className="text-gray-600">Kamu mendapatkan:</p>
            <div className="my-4 p-4 bg-yellow-100 border-2 border-yellow-300 text-yellow-800 rounded-xl text-2xl font-bold shadow-sm">
              {SPIN_DATA[prizeNumber].option}
            </div>
            <button
              onClick={resetAndClose}
              className="mt-2 w-full bg-pink-600 text-white py-2 rounded-lg font-bold hover:bg-pink-700 transition"
            >
              Klaim Hadiah
            </button>
          </div>
        ) : (
          <button
            onClick={handleSpinClick}
            disabled={mustSpin}
            className="w-full rounded-xl bg-linear-to-r from-pink-600 to-purple-600 px-4 py-3 text-white font-bold shadow-lg hover:scale-[1.02] transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {mustSpin ? "Sedang Memutar..." : "PUTAR SEKARANG"}
          </button>
        )}

        {!mustSpin && !showResult && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

const OfferModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-pink-600">
            ✨ Penawaran Hari Ini
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-4 border border-pink-100 rounded-xl bg-pink-50 text-center mb-4">
          <div className="text-4xl mb-2">🛍️</div>
          <h4 className="font-semibold text-gray-800">Voucher Diskon Kilat</h4>
          <p className="text-xs text-gray-500 mt-2">
            Dapatkan potongan 10% khusus check-in hari ini!
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-pink-600 text-white py-2 rounded-lg font-semibold hover:bg-pink-700"
        >
          Ambil Promo Sekarang
        </button>
      </div>
    </div>
  );
};

export default function RamadanCheckinClient() {
  const todayDate = new Date();
  const todayValue = format(todayDate, "yyyy-MM-dd");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exemptSubmitting, setExemptSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const [showExemptOptions, setShowExemptOptions] = useState(false);

  const [status, setStatus] = useState({
    checkedData: [],
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
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(todayDate));

  const [successModal, setSuccessModal] = useState({
    open: false,
    title: "",
    quote: "",
  });
  const [showSpin, setShowSpin] = useState(false);
  const [showOffer, setShowOffer] = useState(false);

  // [BARU] State untuk Promo Popup yang muncul otomatis
  const [showPromo, setShowPromo] = useState(false);

  // Helper Logic
  const checkinDetail = status.checkedData.find((d) => d.date === selectedDate);
  const isSelectedChecked = status.checkedDates.includes(selectedDate);
  const isSelectedExempt = status.exemptDates.some(
    (row) => row.date === selectedDate
  );
  const isToday = selectedDate === todayValue;

  // [LOGIC BARU] Helper untuk mengecek apakah exempt melebihi batas
  const isExemptLimitReached = status.exemptCount >= MAX_EXEMPT_DAYS;

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
    try {
      const res = await axios.get("/ramadan/checkin/status");
      const serve = res?.data?.serve || {};

      const rawCheckedData = serve.checked_data || [];
      const normalizedCheckedData =
        typeof rawCheckedData[0] === "string"
          ? rawCheckedData.map((d) => ({ date: d, time: "-" }))
          : rawCheckedData;

      setStatus({
        checkedData: normalizedCheckedData,
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
      setErrorMsg("Gagal memuat status check-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!isToday)
      return setErrorMsg("Kamu hanya bisa check-in untuk hari ini.");
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour >= 18)
      return setErrorMsg("Check-in hanya dibuka pukul 06:00 - 18:00 WIB.");
    if (isSelectedChecked || isSelectedExempt || submitting) return;

    setSubmitting(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const res = await axios.post("/ramadan/checkin", { date: selectedDate });

      setInfoMsg("Check-in berhasil.");
      setSuccessModal({
        open: true,
        title: "Check-in Berhasil 🎉",
        quote:
          CHECKIN_QUOTES[Math.floor(Math.random() * CHECKIN_QUOTES.length)],
      });

      const nowTime = new Date()
        .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        .replace(".", ":");

      // [LOGIC BARU] Update Optimistic dengan aturan < 21 hari exempt
      setStatus((prev) => {
        const newCheckedCount = prev.checkedCount + 1;
        const totalProgress = newCheckedCount + prev.exemptCount;
        const isEligible =
          totalProgress >= TOTAL_DAYS && prev.exemptCount < MAX_EXEMPT_DAYS;

        return {
          ...prev,
          checkedCount: newCheckedCount,
          hasCheckedToday: true,
          checkedDates: [...prev.checkedDates, selectedDate],
          checkedData: [
            ...prev.checkedData,
            { date: selectedDate, time: nowTime },
          ],
          rewardEligible: isEligible,
        };
      });
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Check-in gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExempt = async () => {
    if (!isToday)
      return setErrorMsg("Kamu hanya bisa mengisi exempt untuk hari ini.");
    if (isSelectedChecked || isSelectedExempt || exemptSubmitting) return;

    setExemptSubmitting(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const res = await axios.post("/ramadan/checkin/exempt", {
        reason: selectedReason,
        date: selectedDate,
      });

      setInfoMsg("Status tersimpan.");
      setSuccessModal({
        open: true,
        title: "Status Tersimpan ✅",
        quote: "Istirahatlah, semoga hari esok lebih baik.",
      });

      // [LOGIC BARU] Update Optimistic dengan aturan < 21 hari exempt
      setStatus((prev) => {
        const newExemptCount = prev.exemptCount + 1;
        const totalProgress = prev.checkedCount + newExemptCount;
        const isEligible =
          totalProgress >= TOTAL_DAYS && newExemptCount < MAX_EXEMPT_DAYS;

        return {
          ...prev,
          exemptCount: newExemptCount,
          hasExemptToday: true,
          exemptDates: [
            ...prev.exemptDates,
            { date: selectedDate, reason: selectedReason },
          ],
          rewardEligible: isEligible,
        };
      });
      setShowExemptOptions(false);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Gagal menyimpan status.");
    } finally {
      setExemptSubmitting(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // [BARU] Munculkan popup promo setelah 1 detik halaman dimuat
    const timer = setTimeout(() => {
      setShowPromo(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setShowExemptOptions(false);
  }, [selectedDate]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 relative">
      {/* --- MODALS --- */}
      {/* [BARU] Tambahkan PromoPopup */}
      <PromoPopup isOpen={showPromo} onClose={() => setShowPromo(false)} />

      <SpinWheelModal open={showSpin} onClose={() => setShowSpin(false)} />
      <OfferModal open={showOffer} onClose={() => setShowOffer(false)} />

      {/* MODAL SUCCESS WITH RECOMMENDATION */}
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {successModal.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600 italic">
                "{successModal.quote}"
              </p>
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <RecommendationList />
            </div>

            <button
              onClick={() =>
                setSuccessModal({ open: false, title: "", quote: "" })
              }
              className="mt-6 w-full rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
            >
              Tutup / Lanjut
            </button>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="mb-6 rounded-3xl border border-pink-100 bg-linear-to-br from-pink-50 via-white to-amber-50 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-pink-600">
            Ramadan Challenge
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            Ramadan Check-in
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-lg">
            Check-in setiap hari jam{" "}
            <span className="font-bold text-pink-600">06:00 - 18:00</span>.
          </p>
        </div>

        {/* Tombol Spin hanya muncul jika eligible */}
        {status.rewardEligible ? (
          <button
            onClick={() => setShowSpin(true)}
            className="animate-bounce bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-full shadow-lg border-2 border-white ring-2 ring-purple-200"
          >
            🎟️ SPIN WHEEL TERSEDIA!
          </button>
        ) : (
          // [BARU] Tampilkan pesan jika sudah melebihi batas exempt
          isExemptLimitReached &&
          status.checkedCount + status.exemptCount >= TOTAL_DAYS && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-medium border border-red-200 text-center max-w-50">
              Maaf, kamu tidak memenuhi syarat Grand Prize (Tidak Puasa &gt; 21
              hari).
            </div>
          )
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Memuat data...
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {status.checkedCount + status.exemptCount}
                    <span className="text-gray-400 text-lg">
                      /{status.totalDays}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Progress Harian</p>
                </div>
                <div className="text-right">
                  {isSelectedChecked ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                      ✅ Sudah Check-in
                    </span>
                  ) : isSelectedExempt ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                      ⚠️ Tidak Puasa
                    </span>
                  ) : isToday ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                      🕒 Hari Ini
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Riwayat / Akan Datang
                    </span>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                  {errorMsg}
                </div>
              )}
              {infoMsg && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-100">
                  {infoMsg}
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                {/* Calendar Nav */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-base font-semibold text-gray-900">
                    {format(currentMonth, "MMMM yyyy")}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setCurrentMonth(subMonths(currentMonth, 1))
                      }
                      className="p-2 rounded-full hover:bg-gray-200"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setCurrentMonth(addMonths(currentMonth, 1))
                      }
                      className="p-2 rounded-full hover:bg-gray-200"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-gray-400">
                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                    (d) => (
                      <div key={d}>{d}</div>
                    )
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-6">
                  {calendarDays.leadingEmpty.map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {calendarDays.days.map((day) => {
                    const value = format(day, "yyyy-MM-dd");
                    const checkinInfo = status.checkedData.find(
                      (d) => d.date === value
                    );
                    const isChecked = !!checkinInfo;
                    const isSelected = value === selectedDate;
                    const isOutside = !isSameMonth(day, currentMonth);
                    const isExempt = status.exemptDates.some(
                      (r) => r.date === value
                    );
                    const isDayToday = value === todayValue;

                    return (
                      <button
                        key={value}
                        onClick={() => setSelectedDate(value)}
                        className={`
                            h-14 flex flex-col items-center justify-center rounded-lg text-sm font-medium transition relative overflow-hidden
                            ${isOutside ? "opacity-30" : ""}
                            ${
                              isSelected
                                ? "ring-2 ring-pink-500 ring-offset-1 z-10"
                                : ""
                            }
                            ${
                              isChecked
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : isExempt
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : isDayToday
                                ? "bg-white border-2 border-pink-200 text-pink-700 font-bold"
                                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                            }
                        `}
                      >
                        <span>{format(day, "d")}</span>
                        {isChecked && (
                          <span className="text-[9px] font-normal opacity-80 mt-0.5">
                            {checkinInfo.time}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* --- PANEL AKSI --- */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isToday || isSelectedChecked || isSelectedExempt
                      ? "bg-white border-pink-100 shadow-sm"
                      : "bg-gray-100 border-gray-200 opacity-60 grayscale"
                  }`}
                >
                  {isSelectedChecked ? (
                    <div className="text-center animate-fade-in">
                      <div className="mb-3 flex flex-col items-center justify-center text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">
                        <span className="text-2xl mb-1">✅</span>
                        <p className="font-bold">
                          Alhamdulillah, Sudah Check-in
                        </p>
                        <p className="text-xs opacity-80">
                          Tercatat pada pukul{" "}
                          <span className="font-mono font-bold bg-green-200 px-1 rounded">
                            {checkinDetail?.time || "-"}
                          </span>{" "}
                          WIB
                        </p>
                      </div>
                      <RecommendationList />
                    </div>
                  ) : isSelectedExempt ? (
                    <div className="text-center animate-fade-in">
                      <div className="mb-3 flex flex-col items-center justify-center text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                        <span className="text-2xl mb-1">⚠️</span>
                        <p className="font-bold">Status: Tidak Puasa</p>
                        <p className="text-xs opacity-80 mt-1">
                          Alasan:{" "}
                          <span className="font-semibold capitalize">
                            {
                              status.exemptDates.find(
                                (r) => r.date === selectedDate
                              )?.reason
                            }
                          </span>
                        </p>
                      </div>
                      <RecommendationList />
                    </div>
                  ) : (
                    <>
                      {!isToday && (
                        <div className="text-center text-xs text-gray-500 mb-2 font-medium">
                          Hanya dapat check-in pada hari ini (
                          {format(todayDate, "d MMM")}).
                        </div>
                      )}

                      {!showExemptOptions ? (
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={handleCheckin}
                            disabled={!isToday || submitting}
                            className={`flex-1 py-4 rounded-xl font-bold text-sm transition shadow-sm border-2 flex items-center justify-center gap-2
                                    ${
                                      !isToday
                                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        : "bg-green-600 text-white border-green-600 hover:bg-green-700 hover:shadow-md active:scale-95"
                                    }
                                  `}
                          >
                            {submitting ? (
                              "Memproses..."
                            ) : (
                              <>✅ Check-in Puasa</>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              isToday && setShowExemptOptions(true)
                            }
                            disabled={!isToday}
                            className={`flex-1 py-4 rounded-xl font-bold text-sm transition shadow-sm border-2 flex items-center justify-center gap-2
                                    ${
                                      !isToday
                                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                                    }
                                  `}
                          >
                            🚫 Tidak Puasa
                          </button>
                        </div>
                      ) : (
                        <div className="animate-scale-in bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-bold text-gray-700">
                              Pilih Alasan Tidak Puasa:
                            </p>
                            <button
                              onClick={() => setShowExemptOptions(false)}
                              className="text-xs text-gray-400 hover:text-red-500 font-medium underline"
                            >
                              Batal
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {[
                              { id: "sakit", label: "🤒 Sakit" },
                              { id: "haid", label: "🩸 Periode" },
                              { id: "perjalanan", label: "🚗 Perjalanan" },
                              { id: "lainnya", label: "📝 Lainnya" },
                            ].map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedReason(item.id)}
                                className={`flex-1 min-w-20 py-2 px-3 text-xs rounded-lg border transition font-medium ${
                                  selectedReason === item.id
                                    ? "bg-yellow-100 border-yellow-400 text-yellow-800 ring-1 ring-yellow-400"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={handleExempt}
                            disabled={exemptSubmitting}
                            className="w-full py-3 rounded-lg bg-yellow-500 text-white font-bold text-sm shadow-sm hover:bg-yellow-600 transition"
                          >
                            {exemptSubmitting
                              ? "Menyimpan..."
                              : "Konfirmasi Tidak Puasa"}
                          </button>
                        </div>
                      )}
                      {isToday && !showExemptOptions && (
                        <p className="text-[10px] text-center text-gray-400 mt-2">
                          *Check-in buka 06:00 - 18:00
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-4">
          <div className="bg-linear-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
            <h3 className="font-bold text-lg mb-1">🎁 Grand Prize</h3>
            <p className="text-white/80 text-sm mb-3">
              Selesaikan 30 hari (Puasa/Exempt) untuk membuka Spin Wheel!
            </p>
            <div className="w-full bg-black/20 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    ((status.checkedCount + status.exemptCount) / TOTAL_DAYS) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h4 className="font-semibold text-gray-900 text-sm mb-3">
              Ketentuan
            </h4>
            <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
              <li>
                Wajib Check-in antara <b>06:00 - 18:00</b>.
              </li>
              <li>
                Jika berhalangan, gunakan fitur <b>Tidak Puasa</b> di hari yang
                sama.
              </li>
              <li>
                Maksimal izin tidak puasa: <b>21 hari</b>.
              </li>
              <li>Tidak bisa melakukan check-in susulan (backdate).</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
