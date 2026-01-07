import { useParams } from "react-router-dom";
import ProductMediaUploader from "./productMediaUploader";

export default function ProductMediasPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Manage Variant Images</h2>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Slot 1–4 untuk preview/replace, dan bulk upload untuk upload banyak sekaligus.
      </p>

      <ProductMediaUploader productId={id ?? ""} />
    </div>
  );
}