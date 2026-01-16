export type CsvRow = Record<string, string>;

// ✅ schema 1: template lama
export const REQUIRED_HEADERS_TEMPLATE = ["name", "category_type_id"] as const;

// ✅ schema 2: master file (header Indonesia)
export const REQUIRED_HEADERS_MASTER = [
  "nama produk",
  "sku master",
  "sku varian 1",
] as const;

export function normalizeHeader(h: string) {
  return (h || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
}

export function normalizeHeaders(fields: string[]) {
  return fields.map((f) =>
    String(f || "")
      .replace(/^\uFEFF/, "")
      .trim()
  );
}

export function isMasterHeaders(fields: string[]) {
  const norm = fields.map(normalizeHeader);
  return REQUIRED_HEADERS_MASTER.every((h) => norm.includes(h));
}

export function isTemplateHeaders(fields: string[]) {
  const norm = fields.map(normalizeHeader);
  return REQUIRED_HEADERS_TEMPLATE.every((h) => norm.includes(h));
}

export function validateHeaders(fields: string[]) {
  const norm = fields.map(normalizeHeader);

  const missTemplate = REQUIRED_HEADERS_TEMPLATE.filter(
    (h) => !norm.includes(h)
  );
  const missMaster = REQUIRED_HEADERS_MASTER.filter((h) => !norm.includes(h));

  const okTemplate = missTemplate.length === 0;
  const okMaster = missMaster.length === 0;

  if (okTemplate || okMaster) return null;

  return `Header CSV tidak cocok format.
Template wajib: ${REQUIRED_HEADERS_TEMPLATE.join(", ")}.
Master wajib: ${REQUIRED_HEADERS_MASTER.join(", ")}`;
}

export function validateRowsTemplate(rows: CsvRow[]) {
  const errors: string[] = [];
  const seenSkus = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    const name = (row.name || "").trim();
    const categoryId = (row.category_type_id || "").trim();
    const basePrice = (row.base_price || "").trim();
    const weight = (row.weight || "").trim();
    const isFlash = (row.is_flash_sale || "").trim();
    const sku = (row.sku || "").trim();

    if (!name) errors.push(`Baris ${rowNumber}: name wajib diisi`);
    if (!categoryId || isNaN(Number(categoryId)))
      errors.push(`Baris ${rowNumber}: category_type_id harus angka`);

    if (
      basePrice !== "" &&
      (isNaN(Number(basePrice)) || Number(basePrice) < 0)
    ) {
      errors.push(
        `Baris ${rowNumber}: base_price harus angka ≥ 0 (atau kosongin)`
      );
    }

    if (weight !== "" && (isNaN(Number(weight)) || Number(weight) < 0)) {
      errors.push(`Baris ${rowNumber}: weight harus angka ≥ 0`);
    }

    if (isFlash !== "" && !["0", "1"].includes(isFlash)) {
      errors.push(`Baris ${rowNumber}: is_flash_sale harus 0 atau 1`);
    }

    if (sku) {
      if (seenSkus.has(sku)) {
        errors.push(`Baris ${rowNumber}: Terdapat duplikat SKU pada ${sku}`);
      } else {
        seenSkus.add(sku);
      }
    }
  });

  return errors;
}

export function validateRowsMaster(rows: CsvRow[]) {
  const errors: string[] = [];
  const seenSkus = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const namaProduk = (row["Nama Produk"] || row["nama produk"] || "").trim();

    if (!namaProduk)
      errors.push(`Baris ${rowNumber}: "Nama Produk" wajib diisi`);

    Object.keys(row).forEach((key) => {
      const normKey = normalizeHeader(key);
      if (normKey === "sku master" || normKey.startsWith("sku varian")) {
        const sku = (row[key] || "").trim();
        if (sku) {
          if (seenSkus.has(sku)) {
            errors.push(
              `Baris ${rowNumber}: Terdapat duplikat SKU pada ${sku}`
            );
          } else {
            seenSkus.add(sku);
          }
        }
      }
    });
  });

  return errors;
}
