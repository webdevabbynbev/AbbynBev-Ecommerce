import api from "@/lib/axios";

export async function updateProfile(payload) {
  const token = localStorage.getItem("token");
  try {
    const res = await api.put("/profile", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || "Failed to update profile";
    throw new Error(msg);
  }
}

export async function getUser() {
  const token = localStorage.getItem("token");
  const res = await api.get("/profile", {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

  const payload = res.data;
  const user =
    payload?.user ??
    payload?.serve ??
    payload?.data?.user ??
    payload?.data?.serve ??
    null;

  return { user };
}

export async function getAddressByQuery(userId) {
  const res = await api.get("/addresses", { params: { user_id: userId } });
  return res.data?.serve ?? [];
}

/**
 * ✅ REGISTER STEP 1: kirim OTP
 * endpoint: POST /auth/register
 */
export async function regis(
  email,
  phone_number,
  first_name,
  last_name,
  gender,
  password,
  send_via = "email"
) {
  try {
    const res = await api.post("/auth/register", {
      email,
      phone_number,
      first_name,
      last_name,
      gender: Number(gender),
      password, // tetap dikirim supaya validator lolos
      send_via,
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Register gagal");
  }
}

/**
 * ✅ REGISTER STEP 2: verify OTP + create user + auto login (token)
 * endpoint: POST /auth/verify-register
 */
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
    const res = await api.post("/auth/verify-register", {
      email,
      phone_number,
      first_name,
      last_name,
      gender: Number(gender),
      password,
      otp: String(otp),
    });

    if (res.data?.serve?.token) {
      localStorage.setItem("token", res.data.serve.token);
    }

    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "OTP Salah");
  }
}

/**
 * ✅ LOGIN TANPA OTP
 * endpoint: POST /auth/login
 */
export async function loginUser(email_or_phone, password, remember_me = false) {
  try {
    const res = await api.post("/auth/login", {
      email_or_phone,
      password,
      remember_me,
    });

    const data = res.data;

    if (data?.serve?.token) {
      localStorage.setItem("token", data.serve.token);
    }

    return data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Login gagal");
  }
}

/**
 * (Optional) kalau masih ada fitur OTP login, ini bisa dipakai.
 * Kalau kamu gak mau OTP login sama sekali, function ini boleh dihapus.
 */
export async function verifyOtp(email_or_phone, otp) {
  try {
    const res = await api.post("/auth/verify-login", {
      email_or_phone,
      otp: String(otp),
    });

    if (res.data?.serve?.token) {
      localStorage.setItem("token", res.data.serve.token);
    }

    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Verifikasi OTP gagal");
  }
}

export async function LoginGoogle(token) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login-google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  });

  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new Error(payload?.message || `LoginGoogle gagal (HTTP ${res.status})`);
  }

  if (payload?.serve?.token) {
    localStorage.setItem("token", payload.serve.token);
  }

  return payload;
}
