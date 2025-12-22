import axios from "@/lib/axios";
import { unwrap } from "@/utils/unwrap";

export async function fetchShippingCost({
  addressId,
  weight,
  courier = "all",
  value = 1,
  quantity = 1,
  noCache = 0,
}) {
  const res = await axios.post("/get-cost", {
    address_id: addressId,
    weight,
    courier,
    value,
    quantity,
    no_cache: noCache ? 1 : 0,
  });

  return unwrap(res);
}
