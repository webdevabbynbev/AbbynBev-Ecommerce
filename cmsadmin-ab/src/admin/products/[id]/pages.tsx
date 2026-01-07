import { useParams } from "react-router-dom";
import MainLayout from "../../../layout/MainLayout";
import ProductMediaUploader from "./ProductMediaUploader";

export default function ProductMediasPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <MainLayout title="Product Media">
      <div style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Manage Variant Images</h2>
        <p style={{ marginBottom: 16, color: "#666" }}>
          Slot 1–4 untuk preview/replace, dan bulk upload untuk upload banyak sekaligus.
        </p>

        <ProductMediaUploader productId={id ?? ""} />
      </div>
    </MainLayout>
  );
}