export function getInitials({ firstName, lastName, email } = {}) {
  const fn = String(firstName || "").trim();
  const ln = String(lastName || "").trim();

  // Normal case: first + last
  if (fn && ln) return (fn[0] + ln[0]).toUpperCase();

  // Single name: ambil 2 huruf pertama
  if (fn) {
    const letters = fn.replace(/[^a-zA-Z0-9]/g, "");
    const a = letters[0] || "U";
    const b = letters[1] || "";
    return (a + b).toUpperCase();
  }

  // Fallback: dari email sebelum "@"
  const em = String(email || "").trim();
  if (em) {
    const local = (em.split("@")[0] || "").replace(/[^a-zA-Z0-9]/g, "");
    const a = local[0] || "U";
    const b = local[1] || "";
    return (a + b).toUpperCase();
  }

  return "U";
}
