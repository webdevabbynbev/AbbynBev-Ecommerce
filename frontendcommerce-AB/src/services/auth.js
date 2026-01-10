import api from "@/lib/axios";
import { setToken, clearToken } from "@/services/authToken";

function s(v) {
  return String(v ?? "").trim();
}

function n(v) {
  const num = Number(v);
  return Number.isFinite(num) ? num : NaN;
}

/** =========================
 *  PROFILE
 *  ========================= */
export async function updateProfile(payload) {
  try {
    const res = await api.put("/profile", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || "Failed to update profile";
    throw new Error(msg);
  }
}

export async function getUser() {
  try {
    const res = await api.get("/profile", { withCredentials: true });

    const payload = res.data;

    const user =
      payload?.serve ??
      payload?.user ??
      payload?.data?.user ??
      payload?.data?.serve ??
      null;

    return { user };
  } catch (err) {
    const msg = err?.response?.data?.message || "Failed to fetch user profile";
    const error = new Error(msg);
    error.status = err?.response?.status;
    throw error;
  }
}

/** =========================
 *  ADDRESS
 *  ========================= */
export async function getAddressByQuery(userId) {
  try {
    const res = await api.get("/addresses", {
      params: { user_id: userId },
    });
    return res.data?.serve ?? res.data?.data ?? [];
  } catch (err) {
    const msg = err?.response?.data?.message || "Failed to fetch addresses";
    throw new Error(msg);
  }
}

/** =========================
 *  REGISTER (OTP)
 *  ========================= */
export async function regis(
  email,
  phone_number,
  first_name,
  last_name,
  gender,
  password,
  send_via = "whatsapp"
) {
  try {
    const payload = {
      email: s(email).toLowerCase(),
      phone_number: s(phone_number),
      first_name: s(first_name),
      last_name: s(last_name),
      gender: n(gender),
      password: String(password ?? ""),
      send_via: s(send_via) || "whatsapp",
    };

    if (!payload.email) throw new Error("Email wajib diisi");
    if (!payload.phone_number) throw new Error("Nomor HP wajib diisi");
    if (!payload.first_name) throw new Error("First name wajib diisi");
    if (!payload.last_name) throw new Error("Last name wajib diisi");
    if (![1, 2].includes(payload.gender)) throw new Error("Gender wajib dipilih");
    if (!payload.password) throw new Error("Password wajib diisi");

    const res = await api.post("/auth/register", payload);
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || "Register gagal";
    throw new Error(msg);
  }
}

export async function OtpRegis(
  email,
  phone_number,
  first_name,
  last_name,
  gender,
  password,
  otp
) {
  try {
    const payload = {
      email: s(email).toLowerCase(),
      phone_number: s(phone_number),
      first_name: s(first_name),
      last_name: s(last_name),
      gender: n(gender),
      password: String(password ?? ""),
      otp: s(otp),
    };

    if (!payload.email) throw new Error("Email wajib diisi");
    if (!payload.otp) throw new Error("OTP wajib diisi");

    const res = await api.post("/auth/verify-register", payload);

    const data = res.data;
    const token = data?.serve?.token;
    if (token) setToken(token);

    return data;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || "OTP Salah";
    throw new Error(msg);
  }
}

/** =========================
 *  LOGIN (NO OTP)
 *  ========================= */
export async function loginUser(email_or_phone, password, remember_me = false) {
  try {
    const payload = {
      email_or_phone: s(email_or_phone),
      password: String(password ?? ""),
      remember_me: Boolean(remember_me),
    };

    if (!payload.email_or_phone) throw new Error("Email/Phone wajib diisi");
    if (!payload.password) throw new Error("Password wajib diisi");

    const res = await api.post("/auth/login", payload);

    const data = res.data;
    const token = data?.serve?.token;
    if (token) setToken(token);

    return data;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || "Login gagal";
    throw new Error(msg);
  }
}

export async function verifyOtp() {
  throw new Error("OTP login is disabled. Use loginUser() instead.");
}

/** =========================
 *  GOOGLE LOGIN / REGISTER
 *  mode:
 *   - "login"    => /auth/login-google     (existing only)
 *   - "register" => /auth/register-google  (boleh create)
 *  ========================= */
export async function LoginGoogle(token, mode = "login") {
  try {
    const endpoint =
      mode === "register" ? "/auth/register-google" : "/auth/login-google";

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });

    let payload = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok) {
      throw new Error(payload?.message || `LoginGoogle gagal (HTTP ${res.status})`);
    }

    const accessToken = payload?.serve?.token;
    if (accessToken) setToken(accessToken);

    return payload;
  } catch (err) {
    throw new Error(err?.message || "Login Google gagal");
  }
}

/** =========================
 *  LOGOUT
 *  ========================= */
export function logoutLocal() {
  clearToken();
}

export async function logoutUser() {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || "Logout failed";
    throw new Error(msg);
  } finally {
    clearToken();
  }
}
