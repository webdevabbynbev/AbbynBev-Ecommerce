import axios from "@/lib/axios";
import { unwrap } from "@/utils/unwrap";

export async function fetchCart({ isCheckout, page = 1, perPage = 1000 } = {}) {
  const params = { page, per_page: perPage };
  if (isCheckout !== undefined && isCheckout !== null && String(isCheckout) !== "") {
    params.is_checkout = isCheckout;
  }

  const res = await axios.get("/cart", { params });
  const payload = unwrap(res);
  const items = payload?.items ?? payload;
  return Array.isArray(items) ? items : [];
}

export async function updateCartQty(id, qty) {
  await axios.put(`/cart/${id}`, { qty });
}

export async function deleteCartItem(id) {
  await axios.delete(`/cart/${id}`);
}

export async function updateCartSelection(cartIds = [], isCheckout) {
  // backend expect: { cart_ids, is_checkout }
  await axios.post("/cart/update-selection", {
    cart_ids: cartIds,
    is_checkout: isCheckout,
  });
}
