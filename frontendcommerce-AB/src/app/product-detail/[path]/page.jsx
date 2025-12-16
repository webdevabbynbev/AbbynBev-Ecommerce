import { getImageUrl } from "@/utils/getImageUrl";

export default async function ProductDetail({ params }) {
  const path = params.path.join("/");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${path}`, {
    cache: "no-store",
  });

  const json = await res.json();
  const product = json?.serve;

  if (!product) return <div className="p-10">Product not found</div>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="mt-2">Rp {Number(product.basePrice || 0).toLocaleString("id-ID")}</p>

      <img
        className="mt-6 w-64 border rounded"
        src={getImageUrl(product.medias?.[0]?.url)}
        alt={product.name}
      />

      <div className="mt-8">
        <h2 className="font-bold">Reviews</h2>
        <ul className="mt-2 space-y-2">
          {(product.reviews ?? []).map((r) => (
            <li key={r.id} className="border p-3 rounded">
              <div>Rating: {r.rating}</div>
              <div>{r.comment}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

