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
import dynamic from "next/dynamic";
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

const Wheel = dynamic(
  () => import("react-custom-roulette-r19").then((mod) => mod.Wheel),
  { ssr: false }
);

// --- CONFIG WARNA BRAND ---
const BRAND_PRIMARY = "#AE2D68";
const BRAND_BG = "#F9EAF4";
const BRAND_LIGHT = "#FDF5FA";
const BRAND_LIGHTER = "#FCE9F3";

// --- UTILS ---
const formatToRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);

// --- DATA (tetap boleh kamu ganti) ---
const DEFAULT_RECOMMENDATION_IMAGE =
  "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";

const SPIN_COLORS = [
  { backgroundColor: "#AE2D68", textColor: "white" },
  { backgroundColor: "#F9A8D4", textColor: "white" },
  { backgroundColor: "#DB2777", textColor: "white" },
  { backgroundColor: "#EC4899", textColor: "white" },
  { backgroundColor: "#9CA3AF", textColor: "white" },
  { backgroundColor: "#BE185D", textColor: "white" },
];
const SPIN_STORAGE_KEY = "ramadan_spin_prizes";

const saveSpinPrize = (prize) => {
  if (!prize?.name) return;
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(SPIN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    const exists = list.some(
      (item) => item?.id === prize?.id || item?.name === prize?.name
    );
    if (exists) return;
    const next = [
      ...list,
      {
        id: prize?.id ?? null,
        name: prize?.name,
        wonAt: new Date().toISOString(),
      },
    ];
    window.localStorage.setItem(SPIN_STORAGE_KEY, JSON.stringify(next));
  } catch {}
};

const TOTAL_DAYS = 30;
const MAX_EXEMPT_DAYS = 7;
const FASTING_TICKET_THRESHOLD = 23;
const CHECKIN_QUOTES = [
  "Setiap langkah kecil hari ini membawa berkah besar esok hari.",
  "Kebaikan yang konsisten akan membentuk kebiasaan baik.",
];

// --- RECOMMENDATION UI (styling dari kode contoh) ---
const RecommendationCard = ({ data }) => {
  const hasSale = (data.compareAt ?? 0) > (data.price ?? 0);
  const href = data.slug ? `/product/${data.slug}` : "#";

  return (
    <div className="group relative flex h-full w-full flex-col rounded-2xl bg-white shadow-[0_2px_8px_rgba(174,45,104,0.08)] transition-all duration-300 active:scale-95 md:hover:scale-105 overflow-hidden border border-[#FCE9F3]">
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
          <span className="text-[10px] text-[#AE2D68]/60 font-medium">
            {data.brand}
          </span>

          <h4 className="text-xs font-bold text-gray-800 line-clamp-2 min-h-[32px] leading-snug mt-1">
            {data.name}
          </h4>

          <div className="flex flex-col mt-2">
            {hasSale ? (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="text-sm font-extrabold text-[#AE2D68]">
                  {formatToRupiah(data.price)}
                </span>
                <span className="text-[10px] text-gray-300 line-through">
                  {formatToRupiah(data.compareAt)}
                </span>
              </div>
            ) : (
              <span className="text-sm font-extrabold text-[#AE2D68]">
                {formatToRupiah(data.price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

const RecommendationList = ({ products, loading }) => (
  <div className="mt-6 w-full animate-slide-up">
    <div className="flex items-center justify-center gap-2 mb-4 opacity-80">
      <Sparkles size={14} className="text-[#AE2D68]" />
      <p className="text-xs font-extrabold text-[#AE2D68]/70 uppercase tracking-widest">
        Rekomendasi Hari Ini
      </p>
      <Sparkles size={14} className="text-[#AE2D68]" />
    </div>
    {loading ? (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`recommendation-skeleton-${index}`}
            className="h-48 rounded-2xl bg-[#FDF5FA] border border-[#FCE9F3] animate-pulse"
          />
        ))}
      </div>
    ) : products.length ? (
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <RecommendationCard key={product.id} data={product} />
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-dashed border-[#FCE9F3] bg-white p-4 text-center text-xs font-bold text-[#AE2D68]/70">
        Belum ada rekomendasi Ramadan untuk hari ini.
      </div>
    )}
  </div>
);

// --- SPIN MODAL (logic API dari kode kamu, styling dari kode contoh) ---
const SpinWheelModal = ({ open, onClose, prizes, tickets, onSpin }) => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [spinLoading, setSpinLoading] = useState(false);
  const [spinError, setSpinError] = useState("");
  const [activePrize, setActivePrize] = useState(null);

  if (!open) return null;

  const wheelData = (prizes || []).map((p, idx) => ({
    option: p?.name ?? `Hadiah ${idx + 1}`,
    style: SPIN_COLORS[idx % SPIN_COLORS.length],
  }));

  const handleStopSpinning = () => {
    setMustSpin(false);
    setShowResult(true);
  };

  const resetAndClose = () => {
    setShowResult(false);
    setMustSpin(false);
    setSpinLoading(false);
    setSpinError("");
    setActivePrize(null);
    setPrizeNumber(0);
    onClose();
  };

  const handleSpinClick = async () => {
    if (mustSpin || spinLoading) return;

    if (!tickets) return setSpinError("Ticket spin belum tersedia.");
    if (!wheelData.length) return setSpinError("Hadiah spin belum tersedia.");

    setSpinLoading(true);
    setSpinError("");

    try {
      const prize = await onSpin();
      if (!prize) {
        setSpinError("Hadiah tidak tersedia.");
        return;
      }

      const index = (prizes || []).findIndex((item) => item?.id === prize?.id);
      setActivePrize(prize);
      setPrizeNumber(index >= 0 ? index : 0);
      setMustSpin(true);
      setShowResult(false);
    } catch (error) {
      setSpinError(error?.response?.data?.message || "Gagal melakukan spin.");
    } finally {
      setSpinLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all">
      <div className="w-full max-w-[90%] md:max-w-md rounded-3xl md:rounded-[2.5rem] bg-white p-6 md:p-8 shadow-2xl text-center relative overflow-hidden flex flex-col items-center border-4 border-[#FCE9F3]">
        <div className="absolute top-0 inset-x-0 h-24 md:h-32 bg-gradient-to-b from-[#F9EAF4] to-transparent pointer-events-none"></div>

        <h2 className="text-xl md:text-2xl font-extrabold text-[#AE2D68] mb-1 relative z-10">
          Putar Keberuntungan!
        </h2>
        <p className="text-[#AE2D68]/60 mb-4 text-xs md:text-sm relative z-10">
          Hadiah spesial menantimu hari ini
        </p>

        {/* {!tickets && (
          <div className="w-full mb-4 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2 flex items-center justify-center gap-2">
            <Info size={14} /> Kamu belum punya tiket spin.
          </div>
        )} */}

        <div className="mb-6 scale-90 md:scale-100 pointer-events-none drop-shadow-xl relative z-10">
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={wheelData.length ? wheelData : [{ option: "..." }]}
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
            fontSize={14}
          />
        </div>

        {showResult ? (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20 animate-fade-in p-6">
            <div className="text-5xl md:text-6xl mb-4 animate-bounce">🎁</div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">
              Selamat!
            </h3>
            <p className="text-[#AE2D68]/70 mt-2 text-sm">Kamu mendapatkan:</p>
            <div className="mt-4 mb-6 px-6 py-3 bg-[#F9EAF4] text-[#AE2D68] rounded-xl text-lg md:text-2xl font-extrabold border-2 border-[#FCE9F3]">
              {activePrize?.name || wheelData[prizeNumber]?.option || "-"}
            </div>
            <button
              onClick={resetAndClose}
              className="w-full bg-[#AE2D68] text-white py-3 md:py-4 rounded-xl font-extrabold shadow-lg shadow-pink-200 active:scale-95 transition-transform"
            >
              Klaim Hadiah
            </button>
          </div>
        ) : (
          <div className="w-full relative z-10">
            {spinError && (
              <div className="mb-3 rounded-2xl bg-red-50 text-red-600 text-xs px-3 py-2 border border-red-200 font-bold">
                {spinError}
              </div>
            )}
            <button
              onClick={handleSpinClick}
              disabled={mustSpin || spinLoading || !tickets}
              className="w-full rounded-xl md:rounded-2xl bg-[#AE2D68] px-4 py-3 md:py-4 text-white font-extrabold shadow-lg shadow-pink-200 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {mustSpin || spinLoading ? "Sedang Memutar..." : "PUTAR SEKARANG"}
            </button>
          </div>
        )}

        {!mustSpin && !showResult && (
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#F9EAF4] text-[#AE2D68] hover:bg-[#FCE9F3] transition z-20"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// --- OFFER MODAL (isi: rekomendasi spesial) ---
const OfferModal = ({ open, onClose, recommendations, loading }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-4 border-[#FCE9F3] relative">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-extrabold text-[#AE2D68] flex items-center gap-2">
            <Sparkles size={18} className="text-[#AE2D68]" />
            Rekomendasi Hari Ini
          </h3>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#F9EAF4] text-[#AE2D68] hover:bg-[#FCE9F3] transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Pilihan produk terbaik untuk menemani Ramadanmu ✨
        </p>

        <div className="rounded-2xl bg-gradient-to-br from-[#FDF5FA] to-[#F9EAF4] border-2 border-[#FCE9F3] p-4">
          <RecommendationList products={recommendations} loading={loading} />
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full bg-[#AE2D68] text-white py-3 rounded-2xl font-extrabold hover:opacity-90 active:scale-95 transition"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

const ClaimTicketModal = ({ open, onSpinNow, onSpinLater, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-4 border-[#FCE9F3] relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F9EAF4] text-[#AE2D68] hover:bg-[#FCE9F3] transition"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        <div className="text-5xl mb-4">🎫</div>
        <h3 className="text-lg font-extrabold text-[#AE2D68] mb-2">Selamat!</h3>
        <p className="text-xs text-gray-600 mb-6 leading-relaxed">
          Kamu mendapatkan <b>1 tiket</b> untuk spin. Mau langsung spin
          sekarang?
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onSpinNow}
            className="w-full bg-[#AE2D68] text-white py-3 rounded-2xl font-extrabold hover:opacity-90 active:scale-95 transition"
          >
            Spin Sekarang
          </button>
          <button
            onClick={onSpinLater}
            className="w-full bg-[#F9EAF4] text-[#AE2D68] py-3 rounded-2xl font-extrabold border-2 border-[#FCE9F3] hover:bg-[#FCE9F3] active:scale-95 transition"
          >
            Spin Nanti
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN CLIENT PAGE ---
export default function RamadanCheckinClient() {
  const todayDate = new Date();
  const todayValue = format(todayDate, "yyyy-MM-dd");
  const fastingTicketThreshold = 23;

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

  const [spinStatus, setSpinStatus] = useState({
    tickets: 0,
    prizes: [],
    fastingDays: 0,
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
  const [showClaimTicket, setShowClaimTicket] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [claimingTicket, setClaimingTicket] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [pendingTicketNotice, setPendingTicketNotice] = useState(false);

  const checkinDetail = status.checkedData.find((d) => d.date === selectedDate);
  const isSelectedChecked = status.checkedDates.includes(selectedDate);
  const isSelectedExempt = status.exemptDates.some(
    (row) => row.date === selectedDate
  );
  const isToday = selectedDate === todayValue;
  const isExemptLimitReached = status.exemptCount >= MAX_EXEMPT_DAYS;
  const canClaimTicket =
    spinStatus.fastingDays >= FASTING_TICKET_THRESHOLD &&
    spinStatus.tickets === 0;

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const leadingEmpty = Array.from({ length: getDay(start) });
    return { days, leadingEmpty };
  }, [currentMonth]);

  const buildRecommendationProducts = (items) =>
    (items || [])
      .map((item) => {
        const product = item?.product;
        if (!product) return null;
        const media = product.medias?.[0];
        return {
          id: product.id ?? item.id,
          name: product.name ?? "Produk Ramadan",
          price: Number(product.basePrice ?? 0),
          compareAt: null,
          brand: product.brand?.name ?? "AbbynBev",
          category: product.categoryType?.name ?? "",
          image: media?.url || DEFAULT_RECOMMENDATION_IMAGE,
          slug: product.slug ?? "",
        };
      })
      .filter(Boolean);

  const loadRecommendations = async (date) => {
    setRecommendationsLoading(true);
    try {
      const response = await axios.get("/admin/ramadan-recommendations", {
        params: { date, per_page: 4 },
      });
      let items = response?.data?.data || [];
      if (!items.length && date) {
        const fallback = await axios.get("/admin/ramadan-recommendations", {
          params: { per_page: 4 },
        });
        items = fallback?.data?.data || [];
      }
      setRecommendations(buildRecommendationProducts(items));
    } catch (error) {
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const loadStatus = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [checkinRes, spinRes] = await Promise.allSettled([
        axios.get("/ramadan/checkin/status"),
        axios.get("/ramadan/spin/status"),
      ]);

      if (checkinRes.status === "fulfilled") {
        const serve = checkinRes.value?.data?.serve || {};
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
      } else {
        setErrorMsg("Gagal memuat status check-in.");
      }

      if (spinRes.status === "fulfilled") {
        const spinServe = spinRes.value?.data?.serve || {};
        setSpinStatus({
          tickets: spinServe.tickets || 0,
          prizes: spinServe.prizes || [],
          fastingDays: spinServe.fasting_days || 0,
        });
      } else {
        setSpinStatus({ tickets: 0, prizes: [], fastingDays: 0 });
      }
    } catch (e) {
      setErrorMsg("Gagal memuat status check-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    const res = await axios.post("/ramadan/spin");
    const prize = res?.data?.serve?.prize;
    saveSpinPrize(prize);
    saveSpinPrize(prize);
    setSpinStatus((prev) => ({
      ...prev,
      tickets:
        res?.data?.serve?.remaining_tickets ??
        Math.max((prev.tickets || 0) - 1, 0),
    }));
    return prize;
  };

  const handleShare = async () => {
    const progress = status.checkedCount + status.exemptCount;
    const shareData = {
      title: "Ramadan Challenge AbbynBev",
      text: `Alhamdulillah! Saya sudah menyelesaikan ${progress} hari di Ramadan Challenge AbbynBev. Ayo ikutan check-in dan menangkan hadiahnya! 🌙✨`,
      url: typeof window !== "undefined" ? window.location.href : "",
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
      // user cancel share - ignore
    }
  };

  const handleClaimTicket = async () => {
    if (!canClaimTicket || claimingTicket) return;

    setClaimingTicket(true);
    setClaimError("");

    try {
      const res = await axios.post("/ramadan/spin/claim");
      const remainingTickets =
        res?.data?.serve?.remaining_tickets ?? res?.data?.serve?.tickets ?? 1;
      setSpinStatus((prev) => ({
        ...prev,
        tickets: remainingTickets,
      }));
      setShowClaimTicket(true);
    } catch (error) {
      setClaimError(
        error?.response?.data?.message || "Gagal mengklaim tiket spin."
      );
    } finally {
      setClaimingTicket(false);
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

      loadStatus();
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
    setInfoMsg("");

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

      loadStatus();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Gagal menyimpan status.");
    } finally {
      setExemptSubmitting(false);
    }
  };

  // ✅ UPDATED: tidak ada popup otomatis lagi
  useEffect(() => {
    loadStatus();
    loadRecommendations(todayValue);
  }, []);

  useEffect(() => {
    setShowExemptOptions(false);
  }, [selectedDate]);

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: BRAND_BG }}>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 relative">
        {/* MODALS */}
        <SpinWheelModal
          open={showSpin}
          onClose={() => setShowSpin(false)}
          prizes={spinStatus.prizes}
          tickets={spinStatus.tickets}
          onSpin={handleSpin}
        />
        <ClaimTicketModal
          open={showClaimTicket}
          onClose={() => setShowClaimTicket(false)}
          onSpinNow={() => {
            setShowClaimTicket(false);
            setShowSpin(true);
          }}
          onSpinLater={() => {
            setShowClaimTicket(false);
            setPendingTicketNotice(true);
          }}
        />
        <OfferModal
          open={showOffer}
          onClose={() => setShowOffer(false)}
          recommendations={recommendations}
          loading={recommendationsLoading}
        />

        {/* SUCCESS MODAL */}
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
                <RecommendationList
                  products={recommendations}
                  loading={recommendationsLoading}
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() =>
                    setSuccessModal({ open: false, title: "", quote: "" })
                  }
                  className="w-full rounded-xl bg-[#AE2D68] px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-pink-200 active:scale-95 transition-transform"
                >
                  Lanjutkan
                </button>

                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F9EAF4] px-4 py-3.5 text-sm font-extrabold text-[#AE2D68] hover:bg-[#FCE9F3] transition-colors border-2 border-[#FCE9F3]"
                >
                  <Share2 size={18} />
                  Bagikan Pencapaian
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="relative overflow-hidden mb-6 rounded-3xl md:rounded-[2.5rem] shadow-2xl text-white group border-4 border-[#FCE9F3]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#AE2D68] to-[#8a2352]"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 p-6 md:p-10 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-extrabold tracking-widest uppercase mb-3 border border-white/20">
                <CalendarDays size={12} /> Ramadan Challenge
              </div>
              <h1 className="text-2xl md:text-5xl font-black mb-2 leading-tight tracking-tight">
                Ramadan Check-in
              </h1>
              <p className="text-white/90 text-xs md:text-base max-w-md leading-relaxed mx-auto md:mx-0">
                Bangun konsistensi ibadahmu. Check-in setiap hari jam{" "}
                <span className="font-extrabold text-white">06:00 - 18:00</span>
                .
              </p>
            </div>

            {/* ✅ PERMINTAAN: Bagikan Progress tetap ada, tidak diganti Spin */}
            <div className="w-full md:w-auto">
              <button
                onClick={handleShare}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl py-3 px-6 font-semibold transition active:scale-95 text-sm"
              >
                <Share2 size={16} className="text-white/90" />
                <span>Bagikan Progress</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1.8fr_1fr] gap-6">
          {/* LEFT */}
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-10 shadow-xl shadow-pink-100/50 border-4 border-[#FCE9F3] order-1">
            {loading ? (
              <div className="h-48 md:h-64 flex items-center justify-center text-[#AE2D68]/40 animate-pulse text-sm">
                Memuat data...
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-10">
                  <div>
                    <div className="text-4xl md:text-5xl font-black text-[#AE2D68] leading-none tracking-tight">
                      {status.checkedCount + status.exemptCount}
                      <span className="text-xl md:text-2xl text-[#AE2D68]/30 font-medium ml-1">
                        /{status.totalDays}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-xs font-extrabold text-[#AE2D68]/60 uppercase tracking-widest mt-2 ml-1">
                      Hari Terselesaikan
                    </p>
                  </div>

                  <div className="flex items-center self-start sm:self-auto">
                    {isSelectedChecked ? (
                      <span className="px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-xl font-extrabold text-xs flex items-center gap-2 border border-green-200">
                        <CheckCircle2 size={16} className="text-green-600" />
                        Sudah Check-in
                      </span>
                    ) : isSelectedExempt ? (
                      <span className="px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 rounded-xl font-extrabold text-xs border border-amber-200">
                        ⚠️ Tidak Puasa
                      </span>
                    ) : isToday ? (
                      <span className="px-4 py-2 bg-[#F9EAF4] text-[#AE2D68] rounded-xl font-extrabold text-xs animate-pulse border border-[#FCE9F3]">
                        🕒 Belum Check-in
                      </span>
                    ) : null}
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex gap-2 border border-red-200">
                    <Info size={16} /> {errorMsg}
                  </div>
                )}

                {infoMsg && (
                  <div className="mb-6 p-3 rounded-xl bg-green-50 text-green-700 text-xs font-bold flex gap-2 border border-green-200">
                    <CheckCircle2 size={16} /> {infoMsg}
                  </div>
                )}

                {/* CALENDAR WRAP */}
                <div className="bg-gradient-to-br from-[#FDF5FA] to-[#F9EAF4] rounded-2xl md:rounded-[2rem] p-4 md:p-8 border-2 border-[#FCE9F3]">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-lg md:text-xl font-extrabold text-[#AE2D68] tracking-tight">
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

                  <div className="grid grid-cols-7 gap-2 md:gap-3 mb-3 text-center text-[10px] font-extrabold text-[#AE2D68]/60 uppercase tracking-widest">
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
                            aspect-square rounded-xl md:rounded-2xl flex flex-col items-center justify-center text-xs md:text-sm font-extrabold transition-all duration-200 relative
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
                          {isChecked &&
                            checkinInfo?.time &&
                            checkinInfo?.time !== "-" && (
                              <span className="text-[9px] font-medium opacity-90 mt-0.5">
                                {checkinInfo.time}
                              </span>
                            )}
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
                        <h3 className="text-lg font-extrabold text-green-700 mb-1">
                          Alhamdulillah!
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                          Tercatat pukul {checkinDetail?.time || "-"} WIB
                        </p>
                      </div>
                    ) : isSelectedExempt ? (
                      <div className="text-center animate-fade-in">
                        <h3 className="text-lg font-extrabold text-amber-600 mb-1">
                          Status: Tidak Puasa
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                          Alasan:{" "}
                          <span className="font-bold">
                            {
                              status.exemptDates.find(
                                (r) => r.date === selectedDate
                              )?.reason
                            }
                          </span>
                        </p>
                      </div>
                    ) : (
                      <>
                        {!isToday && (
                          <div className="text-center text-xs text-gray-500 mb-3 font-bold">
                            Hanya dapat check-in pada hari ini (
                            {format(todayDate, "d MMM")}).
                          </div>
                        )}

                        {!showExemptOptions ? (
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={handleCheckin}
                              disabled={!isToday || submitting}
                              className={`w-full py-3.5 rounded-xl font-extrabold text-sm shadow-lg shadow-pink-100 transition-all active:scale-95 flex items-center justify-center gap-2
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
                              className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all active:scale-95
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
                              <p className="text-sm font-extrabold text-gray-800">
                                Pilih Alasan:
                              </p>
                              <button
                                onClick={() => setShowExemptOptions(false)}
                                className="text-[10px] text-red-500 font-extrabold bg-red-50 px-3 py-1 rounded-full active:scale-95 transition"
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
                                  className={`py-3 px-2 rounded-xl text-xs font-extrabold transition active:scale-95 ${
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
                              className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-extrabold text-sm shadow-lg shadow-amber-200 active:scale-95 transition disabled:opacity-70"
                            >
                              {exemptSubmitting ? "Menyimpan..." : "Konfirmasi"}
                            </button>
                          </div>
                        )}

                        {isToday && !showExemptOptions && (
                          <p className="text-[10px] text-center text-[#AE2D68]/50 mt-3 font-bold">
                            *Check-in buka 06:00 - 18:00 WIB
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT */}
          <aside className="space-y-6 order-2">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#AE2D68] to-[#8a2352] p-6 text-white shadow-xl border-4 border-[#FCE9F3]">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#F9A8D4] rounded-full blur-3xl opacity-40"></div>

              <h3 className="relative z-10 text-lg font-extrabold mb-2 flex items-center gap-2">
                <Gift size={18} className="text-[#F9A8D4]" /> Grand Prize
              </h3>

              {/* ✅ PERMINTAAN: Saat ada Spin Wheel, tampilkan tombol Spin di sini dan hilangkan teks Grand Prize */}
              <div className="relative z-10 text-white/80 text-xs mb-6 leading-relaxed">
                {spinStatus.tickets ? (
                  <button
                    onClick={() => setShowSpin(true)}
                    className="w-full animate-bounce bg-gradient-to-r from-[#F9A8D4] to-[#EC4899] text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-[0_10px_20px_rgba(249,168,212,0.4)] hover:scale-105 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Gift size={18} />
                    SPIN WHEEL TERSEDIA!
                  </button>
                ) : canClaimTicket ? (
                  <button
                    onClick={handleClaimTicket}
                    disabled={claimingTicket}
                    className="text-left text-white/90 hover:text-white underline decoration-white/60 underline-offset-4 transition disabled:opacity-70"
                  >
                    Selesaikan 30 hari tantangan untuk membuka Spin Wheel dan
                    menangkan hadiah eksklusif!{" "}
                    <span className="block mt-1 text-[10px] font-extrabold text-white">
                      Klik untuk klaim tiket spin kamu 🎫
                    </span>
                  </button>
                ) : (
                  <>
                    Selesaikan 30 hari tantangan untuk membuka Spin Wheel dan
                    menangkan hadiah eksklusif!
                  </>
                )}
              </div>

              {claimError && (
                <div className="relative z-10 mb-4 rounded-2xl bg-red-50 text-red-600 text-[10px] px-3 py-2 border border-red-200 font-bold">
                  {claimError}
                </div>
              )}

              {pendingTicketNotice && spinStatus.tickets > 0 && (
                <div className="relative z-10 mb-4 rounded-2xl bg-white/15 text-white text-[10px] px-3 py-2 border border-white/30 font-bold">
                  Kamu punya {spinStatus.tickets} tiket spin belum digunakan.
                </div>
              )}

              <div className="relative z-10">
                <div className="flex justify-between text-[10px] font-extrabold mb-2 text-white/70 uppercase tracking-wider">
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

            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-pink-100/50 border-4 border-[#FCE9F3]">
              <h4 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2 text-sm">
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
                    <b className="text-gray-800">{MAX_EXEMPT_DAYS} hari</b>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#AE2D68] mt-1.5 shrink-0"></div>
                  <span>Tidak bisa check-in susulan.</span>
                </li>
              </ul>

              <button
                onClick={() => setShowOffer(true)}
                className="mt-5 w-full rounded-2xl bg-[#F9EAF4] px-4 py-3 text-sm font-extrabold text-[#AE2D68] hover:bg-[#FCE9F3] transition border-2 border-[#FCE9F3] active:scale-95"
              >
                Lihat Rekomendasi Hari Ini
              </button>
            </div>

            {isExemptLimitReached &&
              status.checkedCount + status.exemptCount >= TOTAL_DAYS && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold text-center shadow-sm border-2 border-red-200">
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
