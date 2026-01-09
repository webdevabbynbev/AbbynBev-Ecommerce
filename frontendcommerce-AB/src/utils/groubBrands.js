export function groupBrandsByAlphabet(brands) {
  const grouped = {};

  brands.forEach((item) => {
    // ambil huruf awal dari brandname
    const firstLetter = item.brandname.charAt(0).toUpperCase();

    // kalau belum ada array untuk huruf ini → buat
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }

    // data brand
    grouped[firstLetter].push(item);
  });

  // urutkan abjad A-Z + isi brand di dalamnya
  return Object.keys(grouped)
    .sort()
    .reduce((acc, key) => {
      acc[key] = grouped[key].sort((a, b) =>
        a.brandname.localeCompare(b.brandname)
      );
      return acc;
    }, {});
}
