import React, { useCallback, useEffect, useState } from "react";
import { Card, Row, Col, Button, Empty, Select, Statistic, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import MainLayout from "../layout/MainLayout";
import dashboardShape from "../assets/img/dashboard-shape.svg";
import http from "../api/http";
import { useNavigate } from "react-router-dom";
import TransactionChart from "../components/Charts/TransactionChart";
import RegisterUserPeriodChart from "../components/Charts/RegisterUserPeriodChart";
import TableUserCart from "../components/Tables/Dashboard/TableUserCart";

interface Product {
  id: number | string;
  name: string;
  total: number;
  base_price?: number;
}

interface ProductTable {
  key: string | number;
  name: string;
  quantity: number;
  price?: number;
}

interface TotalResponse {
  total: number;
}

type ProductOption = {
  value: number;
  label: string;
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [topProducts, setTopProducts] = useState<ProductTable[]>([]);
  const [leastProducts, setLeastProducts] = useState<ProductTable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [totalUsers, setTotalUsers] = useState<TotalResponse | null>(null);
  const [totalTransactionMonth, setTotalTransactionMonth] =
    useState<TotalResponse | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [totalTransaction, setTotalTransaction] =
    useState<TotalResponse | null>(null);

  useEffect(() => {
    fetchTopProducts();
    fetchLeastProducts();
    fetchTotalUsers();
    fetchTotalTransactionMonth();
    fetchTotalTransaction();
  }, []);

  const loadProducts = useCallback(async (q?: string) => {
    setProductsLoading(true);
    try {
      const resp = await http.get(
        `/admin/products?q=${encodeURIComponent(q ?? "")}&page=1&per_page=50`
      );
      const list = resp?.data?.serve?.data ?? resp?.data?.serve ?? [];
      setProductOptions(
        list.map((p: Product) => ({
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
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      const response = await http.get("/admin/top-product-sell");
      if (response?.data?.serve?.length) {
        const formattedData: ProductTable[] = response.data.serve.map(
          (product: Product) => ({
            key: product.id,
            name: product.name,
            quantity: product.total,
            price: product.base_price,
          })
        );
        setTopProducts(formattedData);
      } else {
        setTopProducts([]);
      }
    } catch (error) {
      console.error("Error fetching top products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeastProducts = async () => {
    setLoading(true);
    try {
      const response = await http.get("/admin/less-product-sell");
      if (response?.data?.serve?.length) {
        const formattedData: ProductTable[] = response.data.serve.map(
          (product: Product) => ({
            key: product.id,
            name: product.name,
            quantity: product.total,
          })
        );
        setLeastProducts(formattedData);
      } else {
        setLeastProducts([]);
      }
    } catch (error) {
      console.error("Error fetching less products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalUsers = async () => {
    try {
      const response = await http.get("/admin/total-user");
      if (response?.data?.serve) {
        setTotalUsers(response.data.serve);
      } else {
        setTotalUsers({ total: 0 });
      }
    } catch (error) {
      console.error("Error fetching total users:", error);
    }
  };

  const fetchTotalTransactionMonth = async (selectedMonth?: number) => {
    try {
      const response = await http.get(
        `/admin/total-transaction-month?month=${selectedMonth || month}`
      );
      if (response?.data?.serve) {
        setTotalTransactionMonth(response.data.serve);
      } else {
        setTotalTransactionMonth({ total: 0 });
      }
    } catch (error) {
      console.error("Error fetching total transaction month:", error);
    }
  };

  const fetchTotalTransaction = async () => {
    try {
      const response = await http.get(`/admin/total-transaction`);
      if (response?.data?.serve) {
        setTotalTransaction(response.data.serve);
      } else {
        setTotalTransaction({ total: 0 });
      }
    } catch (error) {
      console.error("Error fetching total transaction:", error);
    }
  };

  const columns: ColumnsType<ProductTable> = [
    {
      title: "No.",
      dataIndex: "key",
      key: "number",
      render: (_text, _record, index) => index + 1,
      width: 70,
    },
    {
      title: "Product Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => navigate(`/product-form?id=${record.key}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Quantity Sold",
      dataIndex: "quantity",
      key: "quantity",
    },
  ];

  return (
    <MainLayout title={"Dashboard"}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card style={{ height: "100%" }}>
            <span>Total Users</span>
            <Statistic value={totalUsers?.total || 0} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card style={{ height: "100%" }}>
            <span>Total Transaction</span>
            <Statistic value={totalTransaction?.total || 0} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card style={{ height: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Total Transaction by Month</span>
              <Select
                defaultValue={new Date().getMonth() + 1}
                style={{ width: 120 }}
                options={[
                  { value: 1, label: "January" },
                  { value: 2, label: "February" },
                  { value: 3, label: "March" },
                  { value: 4, label: "April" },
                  { value: 5, label: "May" },
                  { value: 6, label: "June" },
                  { value: 7, label: "July" },
                  { value: 8, label: "August" },
                  { value: 9, label: "September" },
                  { value: 10, label: "October" },
                  { value: 11, label: "November" },
                  { value: 12, label: "December" },
                ]}
                onChange={(value) => {
                  setMonth(value);
                  fetchTotalTransactionMonth(value);
                }}
              />
            </div>
            <Statistic value={totalTransactionMonth?.total || 0} />
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Manage Product Media">
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={16}>
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
              <Col xs={24} md={8}>
                <Button
                  type="primary"
                  style={{ width: "100%" }}
                  disabled={!selectedProductId}
                  onClick={() =>
                    navigate(`/products/${selectedProductId}/medias`)
                  }
                >
                  Buka Media Produk
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Top 5 Selling Products" style={{ height: "100%" }}>
            <Table<ProductTable>
              loading={loading}
              dataSource={topProducts}
              columns={columns}
              pagination={false}
              scroll={{ y: 300 }}
              locale={{
                emptyText: (
                  <div style={{ padding: "24px 0" }}>
                    <Empty
                      image={dashboardShape}
                      description="No products data available"
                    />
                  </div>
                ),
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Least Selling Products" style={{ height: "100%" }}>
            <Table<ProductTable>
              loading={loading}
              dataSource={leastProducts}
              columns={columns}
              pagination={false}
              scroll={{ y: 300 }}
              locale={{
                emptyText: (
                  <div style={{ padding: "24px 0" }}>
                    <Empty
                      image={dashboardShape}
                      description="No products data available"
                    />
                  </div>
                ),
              }}
            />
          </Card>
        </Col>

        <Col xs={24} style={{ height: "50%" }}>
          <TransactionChart />
        </Col>
        <Col xs={24} style={{ height: "50%" }}>
          <RegisterUserPeriodChart />
        </Col>
        <Col xs={24}>
          <Card title="User Cart">
            <TableUserCart />
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
};

export default DashboardPage;
