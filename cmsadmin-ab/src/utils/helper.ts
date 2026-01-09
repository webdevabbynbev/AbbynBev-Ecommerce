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

const helper = {
  isAuthenticated(): SessionData | null {
    const session = localStorage.getItem("session");
    if (session) {
      try {
        const parsed: SessionData = JSON.parse(session);
        if (parsed?.token) {
          return parsed;
        }
      } catch (e) {
        console.error("Invalid session data", e);
      }
    }
    return null;
  },

  isSessionData(data: SessionData | null): data is SessionData {
    return data !== null;
  },

  truncString(str: string, max: number, add: string = "..."): string {
    return typeof str === "string" && str.length > max
      ? str.substring(0, max) + add
      : str;
  },

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

  hasAnyPermission(
    roleId: RoleEnumType | undefined,
    allowedRoles: RoleEnumType[]
  ): boolean {
    if (!roleId) return false;
    if (roleId === RoleEnum.ADMINISTRATOR) return true;

    return allowedRoles.includes(roleId);
  },

  RoleEnum,
};

export default helper;
