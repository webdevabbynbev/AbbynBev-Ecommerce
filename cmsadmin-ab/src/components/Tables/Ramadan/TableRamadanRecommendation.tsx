import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  DatePicker,
  Modal,
  Select,
  message,
  Tag,
  Space,
  Image,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import http from "../../../api/http";
import dayjs from "dayjs";

const TableRamadanRecommendation: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State untuk Form Tambah
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [productList, setProductList] = useState([]); // List produk untuk dropdown
  const [productSearch, setProductSearch] = useState("");

  // Fetch Data Table
  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await http.get("/admin/ramadan-recommendations");
      setData(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Product untuk Dropdown (Searchable)
  // Fetch Product untuk Dropdown (Searchable)
  const fetchProducts = async (search = "") => {
    try {
      // ✅ FIX: Ganti endpoint dari '/admin/product/list' menjadi '/admin/product'
      // ✅ FIX: Sesuaikan parameter search (biasanya 'q' atau 'search') dan pagination ('per_page')
      const res: any = await http.get(
        `/admin/product?page=1&per_page=20&q=${search}`
      );

      // Ambil data dari response (sesuaikan dengan struktur response API Product Anda)
      // Biasanya ada di res.data.data (jika paginasi standar) atau res.data.serve.data
      const products = res.data.data || res.data.serve?.data || [];

      const options = products.map((p: any) => ({
        label: p.name,
        value: p.id,
        // Pastikan akses media aman (optional chaining)
        image: p.media?.[0]?.url,
      }));
      setProductList(options);
    } catch (error) {
      console.error("Failed to load products", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, []);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedProduct) {
      message.error("Please select date and product");
      return;
    }
    try {
      await http.post("/admin/ramadan-recommendations", {
        product_id: selectedProduct,
        recommendation_date: selectedDate,
      });
      message.success("Recommendation Added");
      setIsModalOpen(false);
      fetchData(); // Refresh table
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to add");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await http.delete(`/admin/ramadan-recommendations/${id}`);
      message.success("Deleted");
      fetchData();
    } catch (error) {
      message.error("Failed to delete");
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "recommendationDate",
      key: "date",
      render: (val: string) => dayjs(val).format("dddd, DD MMMM YYYY"),
      sorter: (a: any, b: any) =>
        dayjs(a.recommendationDate).unix() - dayjs(b.recommendationDate).unix(),
    },
    {
      title: "Product Info",
      key: "product",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {record.product?.media?.[0]?.url ? (
            <Image src={record.product.media[0].url} width={50} />
          ) : (
            <div style={{ width: 50, height: 50, background: "#eee" }} />
          )}
          <div>
            <div style={{ fontWeight: "bold" }}>{record.product?.name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              SKU: {record.product?.sku}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        />
      ),
    },
  ];

  return (
    <Card
      title="Ramadan Product Recommendations"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Recommendation
        </Button>
      }
    >
      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title="Add Product Recommendation"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <div>
            <label>Select Date:</label>
            <DatePicker
              style={{ width: "100%" }}
              onChange={(_, dateStr) => setSelectedDate(dateStr as string)}
            />
          </div>
          <div>
            <label>Select Product:</label>
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder="Search product..."
              optionFilterProp="children"
              onSearch={(val) => {
                // Implement debounce search here ideally
                fetchProducts(val);
              }}
              onChange={(val) => setSelectedProduct(val)}
              options={productList}
              filterOption={false} // Handle filtering on server side or manual
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default TableRamadanRecommendation;
