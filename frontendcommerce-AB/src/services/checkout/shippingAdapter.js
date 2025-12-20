import { n } from "@/utils/number";

const FILTER_CARGO = /JTR|TRUCK|CARGO|KARGO/i;
const PREFERRED = ["REG", "ECO", "YES", "OKE", "EZ", "CTC", "EXP"];

export function normalizeShipping(payload) {
  let base = payload;
  if (payload?.serve) base = payload.serve;
  if (payload?.data) base = payload.data;
  if (payload?.results) base = payload.results;

  let list = Array.isArray(base) ? base : Array.isArray(base?.data) ? base.data : [];
  list = Array.isArray(list) ? list : [];

  const flat = [];
  for (const x of list) {
    if (Array.isArray(x?.costs)) {
      const code = String(x?.code ?? x?.courier ?? x?.name ?? "").trim();
      for (const c of x.costs) {
        let val = 0;
        let etd = "";
        if (Array.isArray(c?.cost) && c.cost[0]) {
          val = n(c.cost[0]?.value ?? c.cost[0]?.cost ?? c.cost[0]?.amount ?? 0, 0);
          etd = String(c.cost[0]?.etd ?? c.cost[0]?.estimate ?? "").trim();
        } else {
          val = n(c?.cost ?? c?.price ?? c?.value ?? 0, 0);
          etd = String(c?.etd ?? c?.estimate ?? "").trim();
        }

        flat.push({
          code,
          service: c?.service ?? c?.service_code ?? c?.serviceCode,
          description: c?.description ?? c?.desc ?? "",
          cost: val,
          etd,
        });
      }
    } else {
      flat.push(x);
    }
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
        x?.service_code ??
        x?.serviceCode ??
        x?.service_name ??
        x?.serviceName ??
        "REG"
    )
      .trim()
      .toUpperCase();

    const cost = n(x?.cost ?? x?.price ?? x?.value ?? x?.amount ?? 0, 0);
    const etd = String(x?.etd ?? x?.estimate ?? "").trim();
    const desc = String(x?.description ?? x?.desc ?? "").trim();

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
      estimate: etd || "-",
      raw: x,
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
