import React, { useEffect, useState } from "react";
import { Card, Select, Table, Input, Button, Image } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { TablePaginationConfig } from "antd/es/table";
import http from "../../../api/http";
import placeholder from "../../../assets/img/placeholder.png";

interface Media {
  type: number;
  url: string;
  alt_text?: string;
}

interface Product {
  id: number | string;
  name: string;
  categoryProduct: {
    name: string;
  };
  medias?: Media[];
}

interface CartItem {
  id: number | string;
  product: Product;
  qty: number;
  attributes: string;
}

interface UserCart {
  id: number | string;
  name: string;
  email: string;
  carts: CartItem[];
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

const columns = () => [
  {
    title: "Name",
    align: "center" as const,
    dataIndex: "name",
  },
  {
    title: "Email",
    align: "center" as const,
    dataIndex: "email",
  },
  {
    title: "Total Product",
    align: "center" as const,
    dataIndex: "carts",
    render: (carts: CartItem[]) => carts.length,
  },
];

const TableUserCart: React.FC = () => {
  const [data, setData] = useState<UserCart[]>([]);
  const [params, setParams] = useState<{ name: string }>({ name: "" });
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData(params, pagination);
  }, []);

  const handleTableChange = (
    newPagination: TablePaginationConfig,
  ) => {
    fetchData(params, {
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
      total: newPagination.total || 0,
    });
  };

  const fetchData = async (filters = params, page = pagination) => {
    setLoading(true);
    try {
      const response = await http.get(
        `/admin/user-carts?q=${filters.name}&page=${page.current}&pageSize=${page.pageSize}`
      );

      const serve = response?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setPagination({
          current: parseInt(serve.currentPage, 10),
          pageSize: parseInt(serve.perPage, 10),
          total: parseInt(serve.total, 10),
        });
      }
    } catch (error) {
      console.error("Error fetching user carts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card style={{ marginTop: 10 }}>
        <div
          className="flex flex-wrap"
          style={{
            width: "100%",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          {}
          <div className="flex align-center">
            <span style={{ fontSize: 12 }}>Show</span>
            <Select
              style={{ width: "80px", marginLeft: 10, marginRight: 10 }}
              value={pagination.pageSize}
              onChange={(e: number) => {
                const newPagination = {
                  current: pagination.current,
                  pageSize: e,
                  total: pagination.total,
                };
                setPagination(newPagination);
                fetchData(params, newPagination);
              }}
            >
              <Select.Option value={10}>10</Select.Option>
              <Select.Option value={50}>50</Select.Option>
              <Select.Option value={100}>100</Select.Option>
              <Select.Option value={500}>500</Select.Option>
            </Select>
            <span style={{ fontSize: 12 }}>entries</span>
          </div>

          {}
          <div className="flex align-center" style={{ gap: "10px" }}>
            <Input
              placeholder="Search by product name, user name, user email"
              value={params.name}
              onChange={(e) => setParams({ ...params, name: e.target.value })}
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchData(params, pagination)}
            >
              Search
            </Button>
            <Button
              onClick={() => {
                setParams({ name: "" });
                fetchData({ name: "" }, pagination);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {}
      <Table<UserCart>
        style={{ marginTop: 10 }}
        columns={columns()}
        rowKey={(record) => record.id}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        expandable={{
          expandedRowRender: (record) => (
            <Table<CartItem>
              rowKey={(record) => record.id}
              dataSource={record.carts}
              pagination={false}
            >
              <Table.Column<CartItem>
                title="Image"
                dataIndex={"product"}
                key="image"
                align="center"
                render={(product: Product) =>
                  product.medias?.some((v) => v.type === 1) ? (
                    <Image
                      alt={
                        product.medias?.find((v) => v.type === 1)?.alt_text || ""
                      }
                      src={product.medias?.find((v) => v.type === 1)?.url}
                      width={70}
                      height={50}
                      style={{ objectFit: "contain" }}
                    />
                  ) : (
                    <Image
                      src={placeholder}
                      width={100}
                      height="100%"
                      preview={false}
                    />
                  )
                }
              />
              <Table.Column<CartItem>
                title="Name"
                dataIndex={"product"}
                key="name"
                width="40%"
                align="center"
                render={(product: Product) => product.name}
              />
              <Table.Column<CartItem>
                title="Category"
                dataIndex={"product"}
                key="category"
                width="20%"
                align="center"
                render={(product: Product) => product.categoryProduct.name}
              />
              <Table.Column<CartItem>
                title="Quantity"
                dataIndex={"qty"}
                key="qty"
                width="5%"
                align="center"
              />
              <Table.Column<CartItem>
                title="Attributes"
                dataIndex={"attributes"}
                key="attributes"
                width="40%"
                align="center"
                render={(text: string) => {
                  try {
                    const attributes = JSON.parse(text);
                    return (
                      <div>
                        {Object.entries(attributes).map(([key, value]) => (
                          <div key={key} style={{ margin: "4px 0" }}>
                            <span style={{ fontWeight: "bold" }}>{key}: </span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  } catch {
                    return null;
                  }
                }}
              />
            </Table>
          ),
          rowExpandable: (record) => record.carts.length > 0,
        }}
      />
    </>
  );
};

export default TableUserCart;
