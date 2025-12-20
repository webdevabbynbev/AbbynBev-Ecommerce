export const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export const isNumericLike = (v) =>
  v !== null && v !== undefined && String(v).trim() !== "" && !Number.isNaN(Number(v));
