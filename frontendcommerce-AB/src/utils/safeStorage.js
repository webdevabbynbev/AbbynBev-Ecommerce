/**
 * Wrapper untuk localStorage/sessionStorage yang:
 * 1. Mencegah menyimpan URLs eksternal
 * 2. Logging akses untuk debugging
 */

const URL_PATTERN = /^https?:\/\//i;
const CLOUDINARY_PATTERN = /cloudinary|res\.cloudinary/i;

function sanitizeValue(value, key = "") {
  if (typeof value !== "string") return value;

  // Log jika ada URL Cloudinary
  if (CLOUDINARY_PATTERN.test(value)) {
    console.warn(
      `[safeStorage] Detected external URL in "${key}":`,
      value.substring(0, 100)
    );
    // Jangan simpan URL eksternal, return null untuk skip
    return null;
  }

  return value;
}

export const safeLocalStorage = {
  setItem(key, value) {
    const sanitized = sanitizeValue(value, key);
    if (sanitized !== null && sanitized !== undefined) {
      try {
        localStorage.setItem(key, sanitized);
      } catch (e) {
        console.error("[safeStorage] Failed to set item:", key, e);
      }
    }
  },

  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error("[safeStorage] Failed to get item:", key, e);
      return null;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("[safeStorage] Failed to remove item:", key, e);
    }
  },
};

export const safeSessionStorage = {
  setItem(key, value) {
    const sanitized = sanitizeValue(value, key);
    if (sanitized !== null && sanitized !== undefined) {
      try {
        sessionStorage.setItem(key, sanitized);
      } catch (e) {
        console.error("[safeStorage] Failed to set item:", key, e);
      }
    }
  },

  getItem(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.error("[safeStorage] Failed to get item:", key, e);
      return null;
    }
  },

  removeItem(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error("[safeStorage] Failed to remove item:", key, e);
    }
  },
};
