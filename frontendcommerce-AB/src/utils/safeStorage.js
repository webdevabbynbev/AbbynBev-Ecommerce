/**
 * Wrapper untuk storage berbasis cookie HttpOnly yang:
 * 1. Mencegah menyimpan URLs eksternal
 * 2. Logging akses untuk debugging
 *
 * Catatan: Cookie HttpOnly harus di-set oleh server (via API route).
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
  async setItem(key, value) {
    const sanitized = sanitizeValue(value, key);
    if (sanitized !== null && sanitized !== undefined) {
      try {
        await fetch("/api/storage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: sanitized }),
        });
      } catch (e) {
        console.error("[safeStorage] Failed to set item:", key, e);
      }
    }
  },

  async getItem(key) {
    try {
      const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}`);
      if (!res.ok) return null;
      const payload = await res.json();
      return payload?.value ?? null;
    } catch (e) {
      console.error("[safeStorage] Failed to get item:", key, e);
      return null;
    }
  },

  async removeItem(key) {
    try {
      await fetch(`/api/storage?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
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
