export const RoleEnum = {
  ADMINISTRATOR: 1,
  GUEST: 2,
  GUDANG: 3,
  FINANCE: 4,
  MEDIA: 5,
  CASHIERNGUDANG: 6,
  CASHIER: 7,
} as const;

export type RoleEnumType = (typeof RoleEnum)[keyof typeof RoleEnum];

export interface SessionUser {
  id: number | string;
  name: string;
  email?: string;
  role?: RoleEnumType;
  role_name?: string;
}

export interface SessionData {
  token?: string;
  user?: SessionUser;
  [key: string]: any;
}

/** ===== Avatar placeholder helpers ===== */
function normalizeNameSegments(name?: string): string[] {
  if (!name) return [];
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean);
}

function avatarInitialsCore(name?: string, maxChars: number = 2): string {
  const seg = normalizeNameSegments(name);
  if (seg.length === 0) return "?";

  // >=2 kata: ambil huruf pertama kata pertama & terakhir (contoh: Genta Lavirgiawan => GL)
  if (seg.length >= 2) {
    const first = seg[0][0] ?? "";
    const last = seg[seg.length - 1][0] ?? "";
    return (first + last).toUpperCase().slice(0, maxChars);
  }

  // 1 kata: ambil 1-2 huruf pertama (contoh: Genta => GE)
  return (seg[0].slice(0, maxChars) || "?").toUpperCase();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  return hash;
}

function avatarColorCore(seed?: string): string {
  const base = (seed || "").trim().toLowerCase();
  if (!base) return "#bfbfbf";

  const h = Math.abs(hashString(base)) % 360;
  return `hsl(${h}, 65%, 45%)`;
}

const helper = {
  /** Ambil session dari localStorage dan validasi token */
  isAuthenticated(): SessionData | null {
    // guard: SSR safety
    if (typeof window === "undefined") return null;

    const session = localStorage.getItem("session");
    if (!session) return null;

    try {
      const parsed: SessionData = JSON.parse(session);
      if (parsed?.token) return parsed;
    } catch (e) {
      console.error("Invalid session data", e);
    }

    return null;
  },

  isSessionData(data: SessionData | null): data is SessionData {
    return data !== null;
  },

  /** Potong string panjang */
  truncString(str: string, max: number, add: string = "..."): string {
    return typeof str === "string" && str.length > max
      ? str.substring(0, max) + add
      : str;
  },

  /** Format rupiah (string/number) */
  formatRupiah(angka: number | string, prefix?: string): string {
    const number_string = angka ? angka.toString().replace(/[^,\d]/g, "") : "";

    const split = number_string.split(",");
    const sisa = split[0].length % 3;
    let rupiah = split[0].substring(0, sisa);
    const ribuan = split[0].substring(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? "." : "";
      rupiah += separator + ribuan.join(".");
    }

    rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah;
    return prefix === undefined ? rupiah : rupiah ? "Rp. " + rupiah : "";
  },

  /** Permission check: Admin always allowed */
  hasAnyPermission(
    roleId: RoleEnumType | undefined,
    allowedRoles: RoleEnumType[]
  ): boolean {
    if (!roleId) return false;
    if (roleId === RoleEnum.ADMINISTRATOR) return true;
    return allowedRoles.includes(roleId);
  },

  /** ===== Avatar placeholder public API ===== */
  avatarInitials(name?: string, maxChars: number = 2): string {
    return avatarInitialsCore(name, maxChars);
  },

  avatarColor(seed?: string): string {
    return avatarColorCore(seed);
  },

  avatarPlaceholder(name?: string, maxChars: number = 2): {
    initials: string;
    color: string;
  } {
    const initials = avatarInitialsCore(name, maxChars);
    const color = avatarColorCore(name);
    return { initials, color };
  },

  RoleEnum,
};

export default helper;
