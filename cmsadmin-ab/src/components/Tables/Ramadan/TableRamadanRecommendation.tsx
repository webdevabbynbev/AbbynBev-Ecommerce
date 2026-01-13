import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Card,
  DatePicker,
  Modal,
  Select,
  message,
  Image,
  Spin, // Import Spin untuk indikator loading
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import http from "../../../api/http"; // Pastikan path ini benar
import dayjs from "dayjs";

const TableRamadanRecommendation: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State untuk Form Tambah
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  // State untuk Product Dropdown
  const [productList, setProductList] = useState([]);
  const [productLoading, setProductLoading] = useState(false); // State loading khusus dropdown

  // Gunakan useRef untuk menyimpan timer debounce agar tidak memicu re-render
  const searchTimer = useRef<any>(null);

  // Fetch Data Table Utama
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

  const fetchProducts = async (search = "") => {
    setProductLoading(true);
    try {
      // 1. Buat Base URL
      // PASTIKAN ENDPOINT INI BENAR (Cek di Postman/Dokumentasi API Anda)
      // Apakah '/admin/product' atau '/admin/products' atau '/admin/product/list'?
      let url = "/admin/product?page=1&per_page=20";

      // 2. Hanya tambahkan parameter search jika user mengetik sesuatu
      if (search) {
        // Coba ganti 'q' dengan 'search' atau 'keyword' sesuai backend Anda
        url += `&q=${encodeURIComponent(search)}`;
      }

      const res: any = await http.get(url);

      // Log untuk memastikan data yang diterima benar
      console.log("Response Product:", res.data);

      const products = res.data.data || res.data.serve?.data || [];

      const options = products.map((p: any) => ({
        label: p.name,
        value: p.id,
        image: p.media?.[0]?.url,
      }));
      setProductList(options);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setProductLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchData();
    fetchProducts(); // Load default list (tanpa search)
  }, []);

  // Handler Search dengan Debounce menggunakan useRef
  const handleSearchProduct = (val: string) => {
    // 1. Clear timer sebelumnya jika user masih mengetik
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    // 2. Set timer baru
    searchTimer.current = setTimeout(() => {
      fetchProducts(val);
    }, 600); // Tunggu 600ms
  };

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
      fetchData();
      // Reset form selection
      setSelectedProduct(null);
      setSelectedDate("");
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
              Barkode:{" "}
              {(record.product?.variants || [])
                .map((variant: any) => variant.barcode)
                .filter(Boolean)
                .join(", ") ||
                record.product?.barcode ||
                "-"}
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
              value={selectedProduct} // Bind value agar bisa direset
              placeholder="Search product..."
              style={{ width: "100%" }}
              defaultActiveFirstOption={false}
              filterOption={false} // PENTING: Matikan filter client-side
              onSearch={handleSearchProduct} // Panggil fungsi debounce
              onChange={(val) => setSelectedProduct(val)}
              notFoundContent={productLoading ? <Spin size="small" /> : null} // Tampilkan spinner saat loading
              loading={productLoading}
              options={productList}
              // Opsional: Custom render option di dropdown
              optionRender={(option: any) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {option.data.image && (
                    <img
                      src={option.data.image}
                      alt=""
                      style={{ width: 20, height: 20, objectFit: "cover" }}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
              )}
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default TableRamadanRecommendation;
