import React, { useEffect, useState } from "react";
import { Card, Col, Row, Select } from "antd";
import http from "../api/http";
import ProductMediaUploader from "../admin/products/[id]/ProductMediaUploader";

type ProductOption = {
  value: number;
  label: string;
};

type ProductResponse = {
  id: number | string;
  name?: string | null;
};

const ProductMediaPage: React.FC = () => {
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const loadProducts = async (q?: string) => {
    setProductsLoading(true);
    try {
      const resp = await http.get(
        `/admin/products?q=${encodeURIComponent(q ?? "")}&page=1&per_page=50`
      );
      const list = resp?.data?.serve?.data ?? resp?.data?.serve ?? [];
      setProductOptions(
        list.map((p: ProductResponse) => ({
          value: Number(p.id),
          label: p.name ?? "-",
        }))
      );
    } catch (error) {
      console.error("Error fetching product options:", error);
      setProductOptions([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div>
      <Card title="Product Media Upload">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={12}>
            <Select
              showSearch
              placeholder="Pilih produk untuk kelola media"
              value={selectedProductId ?? undefined}
              onChange={(value) => setSelectedProductId(value)}
              onSearch={(value) => loadProducts(value)}
              filterOption={false}
              loading={productsLoading}
              options={productOptions}
              style={{ width: "100%" }}
            />
          </Col>
        </Row>
      </Card>

      {selectedProductId ? (
        <div style={{ marginTop: 16 }}>
          <ProductMediaUploader productId={String(selectedProductId)} />
        </div>
      ) : null}
    </div>
  );
};

export default ProductMediaPage;