const USER_KEY = "user";

export function getToken() {
   return null;
}

export function setToken(token) {
  void token;
}

export function refreshTokenTtl() {
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}