export const ssGet = (key) => {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

export const ssSet = (key, value) => {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  } catch {}
};
