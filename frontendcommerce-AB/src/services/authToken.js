const TOKEN_KEY = "token";
const EXP_KEY = "token_expires_at";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

export function getToken() {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(EXP_KEY) || 0);

  if (!token || !exp) {
    clearToken();
    return null;
  }

  if (Date.now() > exp) {
    clearToken();
    return null;
  }

  return token;
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (!token) return;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXP_KEY, String(Date.now() + TTL_MS));
}

export function refreshTokenTtl() {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem(TOKEN_KEY);
  const exp = localStorage.getItem(EXP_KEY);

  if (!token || !exp) return;

  localStorage.setItem(EXP_KEY, String(Date.now() + TTL_MS));
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXP_KEY);
}