const formatToRupiah = (num) => {
  if (!num && num !== 0) return "";
  return "Rp. " + Number(num).toLocaleString("id-ID");
};

export { formatToRupiah };
