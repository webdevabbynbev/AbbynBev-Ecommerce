import { n } from "@/utils/number";

const FILTER_CARGO = /JTR|TRUCK|CARGO|KARGO/i;

const PREFERRED = ["REG", "YES", "CTC", "ECO", "OKE", "ONS", "SDS", "SD", "EXP"];

function buildEtd(x) {
  const range =
    x?.shipment_duration_range ??
    x?.shipmentDurationRange ??
    x?.duration_range ??
    x?.durationRange ??
    x?.etd ??
    x?.estimate ??
    "";

  const unit =
    x?.shipment_duration_unit ??
    x?.shipmentDurationUnit ??
    x?.duration_unit ??
    x?.durationUnit ??
    "";

  const r = String(range || "").trim();
  const u = String(unit || "").trim();

  // ✅ biteship native format
  if (r && u) return `${r} ${u}`;
  if (r) return r;
  return "";
}

function buildEtdFromRaw(raw) {
  if (!raw) return "";
  const r = String(raw?.shipment_duration_range ?? raw?.shipmentDurationRange ?? "").trim();
  const u = String(raw?.shipment_duration_unit ?? raw?.shipmentDurationUnit ?? "").trim();
  if (r && u) return `${r} ${u}`;
  if (r) return r;
  return "";
}

export function normalizeShipping(payload) {
  // backend kamu: { message, serve: [...] }
  let base = payload;
  if (payload?.serve) base = payload.serve;
  if (payload?.data) base = payload.data;
  if (payload?.results) base = payload.results;

  let list = Array.isArray(base) ? base : Array.isArray(base?.data) ? base.data : [];
  list = Array.isArray(list) ? list : [];

  const flat = [];

  for (const x of list) {
    // ✅ Biteship pricing item
    const looksLikeBiteship =
      x &&
      (x?.courier_service_code ||
        x?.courierServiceCode ||
        x?.shipment_duration_unit ||
        x?.shipmentDurationUnit ||
        typeof x?.price !== "undefined");

    if (looksLikeBiteship) {
      const code = String(
        x?.courier_code ?? x?.courierCode ?? x?.code ?? x?.courier ?? x?.name ?? ""
      ).trim();

      const service = String(
        x?.courier_service_code ??
          x?.courierServiceCode ??
          x?.service_code ??
          x?.serviceCode ??
          x?.service ??
          "REG"
      ).trim();

      const serviceName = String(
        x?.courier_service_name ??
          x?.courierServiceName ??
          x?.service_name ??
          x?.serviceName ??
          ""
      ).trim();

      const desc = String(x?.description ?? x?.desc ?? serviceName ?? "").trim();
      const cost = n(x?.price ?? x?.cost ?? x?.value ?? x?.amount ?? 0, 0);

      const estimate = buildEtd(x); // ✅ format asli biteship

      flat.push({
        code,
        service,
        description: desc,
        cost,
        estimate,
        raw: x,
      });
      continue;
    }

    // ✅ RajaOngkir style (compat)
    if (Array.isArray(x?.costs)) {
      const code = String(x?.code ?? x?.courier ?? x?.name ?? "").trim();
      for (const c of x.costs) {
        let val = 0;
        let estimate = "";
        if (Array.isArray(c?.cost) && c.cost[0]) {
          val = n(c.cost[0]?.value ?? c.cost[0]?.cost ?? c.cost[0]?.amount ?? 0, 0);
          estimate = String(c.cost[0]?.etd ?? c.cost[0]?.estimate ?? "").trim();
        } else {
          val = n(c?.cost ?? c?.price ?? c?.value ?? 0, 0);
          estimate = String(c?.etd ?? c?.estimate ?? "").trim();
        }

        flat.push({
          code,
          service: c?.service ?? c?.service_code ?? c?.serviceCode ?? "REG",
          description: c?.description ?? c?.desc ?? "",
          cost: val,
          estimate,
          raw: { courier: x, service: c },
        });
      }
      continue;
    }

    flat.push(x);
  }

  const seen = new Set();
  const out = [];

  for (const x of flat) {
    const code = String(
      x?.code ??
        x?.courier ??
        x?.courier_code ??
        x?.courierCode ??
        x?.courier_name ??
        x?.courierName ??
        x?.name ??
        ""
    )
      .trim()
      .toUpperCase();

    const service = String(
      x?.service ??
        x?.courier_service_code ??
        x?.courierServiceCode ??
        x?.service_code ??
        x?.serviceCode ??
        x?.service_name ??
        x?.serviceName ??
        "REG"
    )
      .trim()
      .toUpperCase();

    const cost = n(x?.cost ?? x?.price ?? x?.value ?? x?.amount ?? 0, 0);

    const estimate = String(
      x?.estimate ??
        x?.etd ??
        x?.estimate_text ??
        x?.estimateText ??
        buildEtdFromRaw(x?.raw) ??
        ""
    ).trim();

    const desc = String(
      x?.description ??
        x?.desc ??
        x?.courier_service_name ??
        x?.courierServiceName ??
        ""
    ).trim();

    if (!code || cost <= 0) continue;

    const bad = FILTER_CARGO.test(service) || FILTER_CARGO.test(desc);
    if (bad) continue;

    const id = `${code}-${service}-${cost}`;
    if (seen.has(id)) continue;
    seen.add(id);

    out.push({
      id,
      courier: code.toLowerCase(),
      service,
      name: `${code} - ${service}`,
      description: desc,
      price: cost,
      estimate: estimate || "-",
      raw: x?.raw ?? x,
    });
  }

  out.sort((a, b) => a.price - b.price);
  return out;
}

export function groupByCourier(list) {
  const groups = {};
  for (const m of list) {
    const k = m.courier || "unknown";
    if (!groups[k]) groups[k] = [];
    groups[k].push(m);
  }
  for (const k of Object.keys(groups)) groups[k].sort((a, b) => a.price - b.price);

  const best = {};
  for (const [courier, items] of Object.entries(groups)) {
    let pick = null;
    for (const p of PREFERRED) {
      pick = items.find((x) => String(x.service).toUpperCase() === p);
      if (pick) break;
    }
    best[courier] = pick || items[0] || null;
  }
  return { groups, best };
}

export function pickCheapestBest(bestMap) {
  const bestList = Object.values(bestMap || {}).filter(Boolean);
  bestList.sort((a, b) => a.price - b.price);
  return bestList[0] || null;
}
