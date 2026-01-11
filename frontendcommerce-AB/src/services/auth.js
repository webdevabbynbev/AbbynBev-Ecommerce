import api from "@/lib/axios";

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
      withCredentials: true,
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
      withCredentials: true,
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
  send_via = "whatsapp",
  accept_privacy_policy = false
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

      accept_privacy_policy: Boolean(accept_privacy_policy),
    };

    if (!payload.email) throw new Error("Email wajib diisi");
    if (!payload.phone_number) throw new Error("Nomor HP wajib diisi");
    if (!payload.first_name) throw new Error("First name wajib diisi");
    if (!payload.last_name) throw new Error("Last name wajib diisi");
    if (![1, 2].includes(payload.gender)) throw new Error("Gender wajib dipilih");
    if (!payload.password) throw new Error("Password wajib diisi");
    if (!payload.accept_privacy_policy)
      throw new Error("Wajib menyetujui Privacy Policy sebelum mendaftar");

    const res = await api.post("/auth/register", payload, {
      withCredentials: true,
    });
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
  otp,
  accept_privacy_policy = false
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

      accept_privacy_policy: Boolean(accept_privacy_policy),
    };

    if (!payload.email) throw new Error("Email wajib diisi");
    if (!payload.otp) throw new Error("OTP wajib diisi");
    if (!payload.accept_privacy_policy)
      throw new Error("Wajib menyetujui Privacy Policy sebelum mendaftar");

    const res = await api.post("/auth/verify-register", payload, {
      withCredentials: true,
    });

    return res.data;
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

    const res = await api.post("/auth/login", payload, {
      withCredentials: true,
    });

    return res.data;
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
 *  ========================= */
export async function LoginGoogle(token, mode = "login", accept_privacy_policy = false) {
  try {
    const endpoint = mode === "register" ? "/auth/register-google" : "/auth/login-google";

    const body =
      mode === "register"
        ? { token, accept_privacy_policy: Boolean(accept_privacy_policy) }
        : { token };

    const res = await api.post(endpoint, body, { withCredentials: true });

    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || "Login Google gagal";
    throw new Error(msg);
  }
}

/** =========================
 *  LOGOUT
 *  ========================= */
// HttpOnly cookie mode: tidak ada token lokal yang perlu dibersihkan
export function logoutLocal() {
  // no-op
}

export async function logoutUser() {
  try {
    await api.post("/auth/logout", null, { withCredentials: true });
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || "Logout failed";
    throw new Error(msg);
  }
}
