export function slugify(text) {
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // ganti spasi dengan -
    .replace(/[^\w\-]+/g, "") // hapus karakter aneh
    .replace(/\-\-+/g, "-"); // ganti -- jadi -
}
