import axios from "@/lib/axios";
import { unwrap } from "@/utils/unwrap";

export async function fetchShippingCost({
  destinationDistrict,
  weight,
  courier = "all",
  price = "all",
}) {
  const res = await axios.post("/get-cost", {
    destination: destinationDistrict,
    weight,
    courier,
    price,
  });

  return unwrap(res);
}
