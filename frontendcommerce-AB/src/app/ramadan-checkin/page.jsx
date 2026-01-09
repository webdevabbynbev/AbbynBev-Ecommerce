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
import Link from "next/link";
import {
  Share2,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Info,
  Gift,
  Sparkles,
} from "lucide-react";

// --- CONFIG WARNA BRAND ---
const BRAND_PRIMARY = "#AE2D68";
const BRAND_BG = "#F9EAF4";
const BRAND_LIGHT = "#FDF5FA";
const BRAND_LIGHTER = "#FCE9F3";

// --- UTILS ---
const formatToRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

// --- DATA DUMMY ---
const RECOMMENDED_PRODUCTS = [
  {
    id: 1,
    name: "Wardah Lightening Facial Wash",
    price: 35000,
    compareAt: 45000,
    brand: "Wardah",
    category: "Skincare",
    image:
      "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png",
    slug: "wardah-lightening-facial-wash",
  },
  {
    id: 2,
    name: "Skintific 5X Ceramide Moisturizer",
    price: 129000,
    compareAt: 159000,
    brand: "Skintific",
    category: "Moisturizer",
    image:
      "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png",
    slug: "skintific-5x-ceramide",
  },
];

const SPIN_DATA = [
  {
    option: "Voucher 50%",
    style: { backgroundColor: "#AE2D68", textColor: "white" },
  },
  {
    option: "Free Ongkir",
    style: { backgroundColor: "#F9A8D4", textColor: "white" },
  },
  {
    option: "Produk Gratis",
    style: { backgroundColor: "#DB2777", textColor: "white" },
  },
  {
    option: "Poin 10rb",
    style: { backgroundColor: "#EC4899", textColor: "white" },
  },
  { option: "Zonk", style: { backgroundColor: "#9CA3AF", textColor: "white" } },
  {
    option: "Diskon 20%",
    style: { backgroundColor: "#BE185D", textColor: "white" },
  },
];

const TOTAL_DAYS = 30;
const MAX_EXEMPT_DAYS = 21;
const CHECKIN_QUOTES = [
  "Setiap langkah kecil hari ini membawa berkah besar esok hari.",
  "Kebaikan yang konsisten akan membentuk kebiasaan baik.",
];

// --- COMPONENTS ---

const RecommendationCard = ({ data }) => {
  const hasSale = data.compareAt > data.price;
  const href = `/product/${data.slug}`;

  return (
    <div className="group relative flex h-full w-full flex-col rounded-xl md:rounded-2xl bg-white shadow-[0_2px_8px_rgba(174,45,104,0.08)] transition-all duration-300 active:scale-95 md:hover:scale-105 overflow-hidden border border-[#FCE9F3]">
      <Link href={href}>
        <div className="relative aspect-square bg-gradient-to-br from-[#FDF5FA] to-[#FCE9F3] overflow-hidden">
          {hasSale && (
            <div className="absolute top-2 left-2 z-10 bg-[#AE2D68] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
              SALE
            </div>
          )}
          <img
            src={data.image}
            alt={data.name}
            className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-110 mix-blend-multiply"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>

        <div className="p-3 bg-white">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] text-[#AE2D68]/60 font-medium">
              {data.brand}
            </span>
          </div>
          <h4 className="text-xs font-bold text-gray-800 line-clamp-2 min-h-[32px] leading-snug">
            {data.name}
          </h4>

          <div className="flex flex-col mt-2">
            {hasSale ? (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="text-sm font-bold text-[#AE2D68]">
                  {formatToRupiah(data.price)}
                </span>
                <span className="text-[10px] text-gray-300 line-through">
                  {formatToRupiah(data.compareAt)}
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-[#AE2D68]">
                {formatToRupiah(data.price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

const RecommendationList = () => (
  <div className="mt-6 w-full animate-slide-up">
    <div className="flex items-center justify-center gap-2 mb-4 opacity-80">
      <Sparkles size={14} className="text-[#AE2D68]" />
      <p className="text-xs font-bold text-[#AE2D68]/70 uppercase tracking-widest">
        Rekomendasi Spesial
      </p>
      <Sparkles size={14} className="text-[#AE2D68]" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      {RECOMMENDED_PRODUCTS.map((product, idx) => (
        <RecommendationCard key={idx} data={product} />
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all">
      <div className="w-full max-w-[90%] md:max-w-md rounded-3xl md:rounded-[2.5rem] bg-white p-6 md:p-8 shadow-2xl text-center relative overflow-hidden flex flex-col items-center border-4 border-[#FCE9F3]">
        <div className="absolute top-0 inset-x-0 h-24 md:h-32 bg-gradient-to-b from-[#F9EAF4] to-transparent pointer-events-none"></div>

        <h2 className="text-xl md:text-2xl font-extrabold text-[#AE2D68] mb-1 relative z-10">
          Putar Keberuntungan!
        </h2>
        <p className="text-[#AE2D68]/60 mb-6 text-xs md:text-sm relative z-10">
          Hadiah spesial menantimu hari ini
        </p>

        {/* Wheel scaled for mobile */}
        <div className="mb-6 scale-90 md:scale-100 pointer-events-none drop-shadow-xl relative z-10">
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={SPIN_DATA}
            onStopSpinning={handleStopSpinning}
            backgroundColors={["#AE2D68", "#DB2777"]}
            textColors={["#ffffff"]}
            outerBorderColor="#AE2D68"
            outerBorderWidth={5}
            innerRadius={20}
            innerBorderColor="#AE2D68"
            innerBorderWidth={0}
            radiusLineColor="#FCE9F3"
            radiusLineWidth={1}
            fontSize={14} // Reduced font size for mobile
          />
        </div>

        {showResult ? (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20 animate-fade-in p-6">
            <div className="text-5xl md:text-6xl mb-4 animate-bounce">🎁</div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">
              Selamat!
            </h3>
            <p className="text-[#AE2D68]/70 mt-2 text-sm">Kamu mendapatkan:</p>
            <div className="mt-4 mb-6 px-6 py-3 bg-[#F9EAF4] text-[#AE2D68] rounded-xl text-lg md:text-2xl font-bold border-2 border-[#FCE9F3]">
              {SPIN_DATA[prizeNumber].option}
            </div>
            <button
              onClick={resetAndClose}
              className="w-full bg-[#AE2D68] text-white py-3 md:py-4 rounded-xl font-bold shadow-lg shadow-pink-200 active:scale-95 transition-transform"
            >
              Klaim Hadiah
            </button>
          </div>
        ) : (
          <button
            onClick={handleSpinClick}
            disabled={mustSpin}
            className="w-full relative z-10 rounded-xl md:rounded-2xl bg-[#AE2D68] px-4 py-3 md:py-4 text-white font-bold shadow-lg shadow-pink-200 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {mustSpin ? "Sedang Memutar..." : "PUTAR SEKARANG"}
          </button>
        )}

        {!mustSpin && !showResult && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#F9EAF4] text-[#AE2D68] hover:bg-[#FCE9F3] transition z-20"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function RamadanCheckinPage() {
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
  const [showPromo, setShowPromo] = useState(false);

  const checkinDetail = status.checkedData.find((d) => d.date === selectedDate);
  const isSelectedChecked = status.checkedDates.includes(selectedDate);
  const isSelectedExempt = status.exemptDates.some(
    (row) => row.date === selectedDate
  );
  const isToday = selectedDate === todayValue;
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

  const handleShare = async () => {
    const progress = status.checkedCount + status.exemptCount;
    const shareData = {
      title: "Ramadan Challenge AbbynBev",
      text: `Alhamdulillah! Saya sudah menyelesaikan ${progress} hari di Ramadan Challenge AbbynBev. Ayo ikutan check-in dan menangkan hadiahnya! 🌙✨`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        alert("Link dan pesan berhasil disalin ke clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
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

    try {
      await axios.post("/ramadan/checkin", { date: selectedDate });
      setSuccessModal({
        open: true,
        title: "Check-in Berhasil",
        quote:
          CHECKIN_QUOTES[Math.floor(Math.random() * CHECKIN_QUOTES.length)],
      });
      const nowTime = new Date()
        .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        .replace(".", ":");
      setStatus((prev) => {
        const newCheckedCount = prev.checkedCount + 1;
        const totalProgress = newCheckedCount + prev.exemptCount;
        return {
          ...prev,
          checkedCount: newCheckedCount,
          hasCheckedToday: true,
          checkedDates: [...prev.checkedDates, selectedDate],
          checkedData: [
            ...prev.checkedData,
            { date: selectedDate, time: nowTime },
          ],
          rewardEligible:
            totalProgress >= TOTAL_DAYS && prev.exemptCount < MAX_EXEMPT_DAYS,
        };
      });
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Check-in gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExempt = async () => {
    if (!isToday) return setErrorMsg("Exempt hanya untuk hari ini.");
    if (isSelectedChecked || isSelectedExempt || exemptSubmitting) return;

    setExemptSubmitting(true);
    setErrorMsg("");

    try {
      await axios.post("/ramadan/checkin/exempt", {
        reason: selectedReason,
        date: selectedDate,
      });
      setSuccessModal({
        open: true,
        title: "Status Tersimpan",
        quote: "Istirahatlah, semoga hari esok lebih baik.",
      });
      setStatus((prev) => {
        const newExemptCount = prev.exemptCount + 1;
        const totalProgress = prev.checkedCount + newExemptCount;
        return {
          ...prev,
          exemptCount: newExemptCount,
          hasExemptToday: true,
          exemptDates: [
            ...prev.exemptDates,
            { date: selectedDate, reason: selectedReason },
          ],
          rewardEligible:
            totalProgress >= TOTAL_DAYS && newExemptCount < MAX_EXEMPT_DAYS,
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
    const timer = setTimeout(() => setShowPromo(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setShowExemptOptions(false);
  }, [selectedDate]);

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: BRAND_BG }}>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 relative">
        <SpinWheelModal open={showSpin} onClose={() => setShowSpin(false)} />

        {/* --- MODAL SUCCESS (Mobile Optimized) --- */}
        {successModal.open && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 md:p-4">
            <div className="w-full md:max-w-sm rounded-t-[2rem] md:rounded-[2.5rem] bg-white p-6 md:p-8 shadow-2xl animate-slide-up md:animate-scale-in max-h-[90vh] overflow-y-auto relative border-t-4 md:border-4 border-[#FCE9F3]">
              <button
                onClick={() =>
                  setSuccessModal({ open: false, title: "", quote: "" })
                }
                className="absolute top-4 right-4 md:top-6 md:right-6 text-[#AE2D68]/40 hover:text-[#AE2D68] transition bg-gray-50 rounded-full p-1"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-[#F9EAF4] rounded-full mb-4 shadow-inner border-2 border-[#FCE9F3]">
                  <CheckCircle2
                    size={32}
                    className="md:w-10 md:h-10 text-[#AE2D68]"
                  />
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-3">
                  {successModal.title}
                </h2>

                <div className="bg-[#F9EAF4] rounded-2xl p-4 mx-1 border-2 border-[#FCE9F3]">
                  <p className="text-xs md:text-sm text-[#AE2D68] font-medium leading-relaxed italic">
                    "{successModal.quote}"
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <RecommendationList />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() =>
                    setSuccessModal({ open: false, title: "", quote: "" })
                  }
                  className="w-full rounded-xl bg-[#AE2D68] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-200 active:scale-95 transition-transform"
                >
                  Lanjutkan
                </button>

                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F9EAF4] px-4 py-3.5 text-sm font-bold text-[#AE2D68] hover:bg-[#FCE9F3] transition-colors border-2 border-[#FCE9F3]"
                >
                  <Share2 size={18} />
                  Bagikan Pencapaian
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- HEADER (Mobile Stack) --- */}
        <div className="relative overflow-hidden mb-6 rounded-3xl md:rounded-[2.5rem] shadow-2xl text-white group border-4 border-[#FCE9F3]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#AE2D68] to-[#8a2352]"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 p-6 md:p-10 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 border border-white/20">
                <CalendarDays size={12} /> Ramadan Challenge
              </div>
              <h1 className="text-2xl md:text-5xl font-black mb-2 leading-tight tracking-tight">
                Ramadan Check-in
              </h1>
              <p className="text-white/90 text-xs md:text-base max-w-md leading-relaxed mx-auto md:mx-0">
                Bangun konsistensi ibadahmu. Check-in setiap hari jam{" "}
                <span className="font-bold text-white">06:00 - 18:00</span>.
              </p>
            </div>

            <div className="w-full md:w-auto">
              {status.rewardEligible ? (
                <button
                  onClick={() => setShowSpin(true)}
                  className="w-full md:w-auto animate-bounce bg-gradient-to-r from-[#F9A8D4] to-[#EC4899] text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_10px_20px_rgba(249,168,212,0.4)] hover:scale-105 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Gift size={18} />
                  SPIN WHEEL TERSEDIA!
                </button>
              ) : (
                <button
                  onClick={handleShare}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl py-3 px-6 font-semibold transition active:scale-95 text-sm"
                >
                  <Share2 size={16} className="text-white/90" />
                  <span>Bagikan Progress</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- MAIN GRID (Flex-col for Mobile) --- */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1.8fr_1fr] gap-6">
          {/* KOLOM KIRI: CALENDAR */}
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-10 shadow-xl shadow-pink-100/50 border-4 border-[#FCE9F3] order-1">
            {loading ? (
              <div className="h-48 md:h-64 flex items-center justify-center text-[#AE2D68]/40 animate-pulse text-sm">
                Memuat data...
              </div>
            ) : (
              <>
                {/* Progress Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-10">
                  <div>
                    <div className="text-4xl md:text-5xl font-black text-[#AE2D68] leading-none tracking-tight">
                      {status.checkedCount + status.exemptCount}
                      <span className="text-xl md:text-2xl text-[#AE2D68]/30 font-medium ml-1">
                        /{status.totalDays}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-xs font-bold text-[#AE2D68]/60 uppercase tracking-widest mt-2 ml-1">
                      Hari Terselesaikan
                    </p>
                  </div>

                  <div className="flex items-center self-start sm:self-auto">
                    {isSelectedChecked ? (
                      <span className="px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-xl font-bold text-xs flex items-center gap-2 border border-green-200">
                        <CheckCircle2 size={16} className="text-green-600" />
                        Sudah Check-in
                      </span>
                    ) : isSelectedExempt ? (
                      <span className="px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 rounded-xl font-bold text-xs border border-amber-200">
                        ⚠️ Tidak Puasa
                      </span>
                    ) : isToday ? (
                      <span className="px-4 py-2 bg-[#F9EAF4] text-[#AE2D68] rounded-xl font-bold text-xs animate-pulse border border-[#FCE9F3]">
                        🕒 Belum Check-in
                      </span>
                    ) : null}
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium flex gap-2 border border-red-200">
                    <Info size={16} /> {errorMsg}
                  </div>
                )}

                {/* CALENDAR */}
                <div className="bg-gradient-to-br from-[#FDF5FA] to-[#F9EAF4] rounded-2xl md:rounded-[2rem] p-4 md:p-8 border-2 border-[#FCE9F3]">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-lg md:text-xl font-bold text-[#AE2D68] tracking-tight">
                      {format(currentMonth, "MMMM yyyy")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentMonth(subMonths(currentMonth, 1))
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-[#AE2D68] active:bg-[#FCE9F3] border border-[#FCE9F3]"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentMonth(addMonths(currentMonth, 1))
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-[#AE2D68] active:bg-[#FCE9F3] border border-[#FCE9F3]"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 md:gap-3 mb-3 text-center text-[10px] font-bold text-[#AE2D68]/60 uppercase tracking-widest">
                    {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                      (d) => (
                        <div key={d}>{d}</div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-2 md:gap-3 mb-6">
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
                            aspect-square rounded-xl md:rounded-2xl flex flex-col items-center justify-center text-xs md:text-sm font-bold transition-all duration-200 relative
                            ${isOutside ? "opacity-20" : "opacity-100"}
                            ${
                              isSelected
                                ? "ring-2 md:ring-[3px] ring-[#AE2D68] ring-offset-1 scale-105 z-10 bg-white shadow-md"
                                : "active:bg-white active:scale-95"
                            }
                            ${
                              isChecked
                                ? "bg-gradient-to-br from-green-400 to-green-500 text-white shadow-md shadow-green-200"
                                : isExempt
                                ? "bg-amber-100 text-amber-700"
                                : isDayToday
                                ? "bg-white text-[#AE2D68]"
                                : "bg-white text-gray-500"
                            }
                          `}
                        >
                          {isChecked && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                          )}
                          <span>{format(day, "d")}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTION SECTION */}
                  <div
                    className={`p-5 md:p-8 rounded-2xl md:rounded-[2rem] transition-all duration-500 ${
                      isToday || isSelectedChecked || isSelectedExempt
                        ? "bg-white shadow-xl shadow-gray-100 translate-y-0 opacity-100 border-2 border-[#FCE9F3]"
                        : "bg-gray-100 opacity-50 grayscale translate-y-2"
                    }`}
                  >
                    {isSelectedChecked ? (
                      <div className="text-center animate-fade-in">
                        <h3 className="text-lg font-bold text-green-700 mb-1">
                          Alhamdulillah!
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                          Tercatat pukul {checkinDetail?.time || "-"} WIB
                        </p>
                        <div className="bg-gradient-to-br from-[#FDF5FA] to-[#F9EAF4] p-3 rounded-xl border border-[#FCE9F3]">
                          <RecommendationList />
                        </div>
                      </div>
                    ) : isSelectedExempt ? (
                      <div className="text-center animate-fade-in">
                        <h3 className="text-lg font-bold text-amber-600 mb-1">
                          Status: Tidak Puasa
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                          Alasan:{" "}
                          <span className="font-semibold">
                            {
                              status.exemptDates.find(
                                (r) => r.date === selectedDate
                              )?.reason
                            }
                          </span>
                        </p>
                        <div className="bg-gradient-to-br from-[#FDF5FA] to-[#F9EAF4] p-3 rounded-xl border border-[#FCE9F3]">
                          <RecommendationList />
                        </div>
                      </div>
                    ) : (
                      <>
                        {!showExemptOptions ? (
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={handleCheckin}
                              disabled={!isToday || submitting}
                              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-pink-100 transition-all active:scale-95 flex items-center justify-center gap-2
                                ${
                                  !isToday
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-[#AE2D68] text-white"
                                }
                              `}
                            >
                              {submitting
                                ? "Menyimpan..."
                                : "✅ CHECK-IN SEKARANG"}
                            </button>
                            <button
                              onClick={() =>
                                isToday && setShowExemptOptions(true)
                              }
                              disabled={!isToday}
                              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95
                                ${
                                  !isToday
                                    ? "text-gray-300"
                                    : "bg-white text-gray-500 hover:bg-[#FCE9F3] hover:text-gray-800 shadow-sm border-2 border-[#FCE9F3]"
                                }
                              `}
                            >
                              🚫 Tidak Puasa
                            </button>
                          </div>
                        ) : (
                          <div className="animate-scale-in">
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-sm font-bold text-gray-800">
                                Pilih Alasan:
                              </p>
                              <button
                                onClick={() => setShowExemptOptions(false)}
                                className="text-[10px] text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full active:scale-95 transition"
                              >
                                BATAL
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              {[
                                { id: "sakit", label: "🤒 Sakit" },
                                { id: "haid", label: "🩸 Haid" },
                                { id: "perjalanan", label: "🚗 Perjalanan" },
                                { id: "lainnya", label: "📝 Lainnya" },
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => setSelectedReason(item.id)}
                                  className={`py-3 px-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                                    selectedReason === item.id
                                      ? "bg-amber-100 text-amber-800 shadow-inner border-2 border-amber-200"
                                      : "bg-white text-gray-500 shadow-sm border border-[#FCE9F3]"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={handleExempt}
                              disabled={exemptSubmitting}
                              className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-200 active:scale-95 transition"
                            >
                              {exemptSubmitting ? "Menyimpan..." : "Konfirmasi"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* KOLOM KANAN: SIDEBAR (Order 2 on Mobile) */}
          <aside className="space-y-6 order-2">
            {/* Grand Prize Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#AE2D68] to-[#8a2352] p-6 text-white shadow-xl border-4 border-[#FCE9F3]">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#F9A8D4] rounded-full blur-3xl opacity-40"></div>

              <h3 className="relative z-10 text-lg font-bold mb-2 flex items-center gap-2">
                <Gift size={18} className="text-[#F9A8D4]" /> Grand Prize
              </h3>
              <p className="relative z-10 text-white/80 text-xs mb-6 leading-relaxed">
                Selesaikan 30 hari tantangan untuk membuka Spin Wheel dan
                menangkan hadiah eksklusif!
              </p>

              <div className="relative z-10">
                <div className="flex justify-between text-[10px] font-bold mb-2 text-white/70 uppercase tracking-wider">
                  <span>Progress</span>
                  <span>
                    {Math.round(
                      ((status.checkedCount + status.exemptCount) /
                        TOTAL_DAYS) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
                  <div
                    className="bg-gradient-to-r from-[#F9A8D4] to-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,168,212,0.8)]"
                    style={{
                      width: `${
                        ((status.checkedCount + status.exemptCount) /
                          TOTAL_DAYS) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-pink-100/50 border-4 border-[#FCE9F3]">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <Info size={16} className="text-[#AE2D68]" /> Ketentuan
              </h4>
              <ul className="text-xs text-gray-500 space-y-3">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#AE2D68] mt-1.5 shrink-0"></div>
                  <span>
                    Wajib Check-in antara{" "}
                    <b className="text-gray-800">06:00 - 18:00 WIB</b>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#AE2D68] mt-1.5 shrink-0"></div>
                  <span>
                    Max izin (tidak puasa):{" "}
                    <b className="text-gray-800">21 hari</b>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#AE2D68] mt-1.5 shrink-0"></div>
                  <span>Tidak bisa check-in susulan.</span>
                </li>
              </ul>
            </div>

            {/* Limit Warning */}
            {isExemptLimitReached &&
              status.checkedCount + status.exemptCount >= TOTAL_DAYS && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-xs font-medium text-center shadow-sm border-2 border-red-200">
                  Maaf, kamu tidak memenuhi syarat Grand Prize (Tidak Puasa &gt;
                  21 hari).
                </div>
              )}
          </aside>
        </div>
      </div>
    </div>
  );
}
