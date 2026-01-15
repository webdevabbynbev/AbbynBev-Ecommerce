import React from "react";
import { Table, Button, Input, Card, Popconfirm, Tag, Select } from "antd";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import moment from "moment";
import http from "../../../api/http";
import helper from "../../../utils/helper";
import { useNavigate } from "react-router-dom";

type DiscountRecord = {
  id: number | string;
  name: string | null;
  code: string;
  description?: string | null;

  valueType: number; // 1 percentage, 2 nominal
  value: string; // decimal as string
  maxDiscount?: string | null;

  appliesTo: number; // 0 all, 1 min_order, 2 collection(category_type), 3 variant
  minOrderAmount?: string | null;

  isActive: number; // 1 active, 2 inactive
  startedAt?: string | null;
  expiredAt?: string | null;

  isEcommerce?: number; // 1/0
  isPos?: number; // 1/0

  qty?: number | null; // limit total (optional)
};

const appliesLabel = (v: number) => {
  if (v === 0) return "Semua Pesanan";
  if (v === 1) return "Pesanan Minimal";
  if (v === 2) return "Koleksi Produk";
  if (v === 3) return "Varian Produk";
  if (v === 4) return "Brand";
  if (v === 5) return "Produk";
  return "-";
};

const TableDiscount: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = React.useState<DiscountRecord[]>([]);
  const [params, setParams] = React.useState<{ q?: string }>({ q: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = React.useState(false);
  const { Search } = Input;

  const fetchList = async (q = params, page = pagination) => {
    setLoading(true);
    try {
      const resp: any = await http.get(
        `/admin/discounts?q=${encodeURIComponent(q.q ?? "")}&page=${page.current}&per_page=${page.pageSize}`
      );

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setPagination({
          current: Number(serve.currentPage),
          pageSize: Number(serve.perPage),
          total: Number(serve.total),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange: TableProps<DiscountRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const columns: ColumnsType<DiscountRecord> = [
    { title: "Name", dataIndex: "name" },
    { title: "Code", dataIndex: "code" },
    {
      title: "Value",
      dataIndex: "value",
      render: (_: unknown, r) =>
        r.valueType === 1
          ? `${Number(r.value)}%${
              r.maxDiscount ? ` (max Rp.${helper.formatRupiah(r.maxDiscount)})` : ""
            }`
          : `Rp.${helper.formatRupiah(r.value ?? 0)}`,
    },
    {
      title: "Untuk",
      dataIndex: "appliesTo",
      render: (_: unknown, r) => <Tag>{appliesLabel(r.appliesTo)}</Tag>,
    },
    {
      title: "Channel",
      dataIndex: "channel",
      render: (_: unknown, r) => (
        <>
          {r.isEcommerce ? <Tag color="blue">Ecommerce</Tag> : null}
          {r.isPos ? <Tag color="green">POS</Tag> : null}
        </>
      ),
    },
    {
      title: "Periode",
      dataIndex: "period",
      responsive: ["lg"],
      render: (_: unknown, r) => {
        const s = r.startedAt ? moment(r.startedAt).format("DD MMM YYYY") : "-";
        const e = r.expiredAt ? moment(r.expiredAt).format("DD MMM YYYY") : "No Expiry";
        return `${s} → ${e}`;
      },
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (_: unknown, r) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {r.isActive === 1 ? <Tag color="#2db7f5">ACTIVE</Tag> : <Tag color="red">NON ACTIVE</Tag>}
          <Popconfirm
            placement="left"
            title="Update status?"
            onConfirm={async () => {
              await http.put("/admin/discounts/status", {
                id: r.id,
                is_active: r.isActive === 2 ? 1 : 2,
              });
              fetchList(params, pagination);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button type="dashed" size="small">
              {r.isActive === 2 ? "Set Active" : "Set Non Active"}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
    {
      title: "#",
      width: "14%",
      align: "center",
      render: (_: unknown, r) => (
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/discounts/${r.id}`, { state: r })}
          >
            Edit
          </Button>

          <Popconfirm
            placement="left"
            title="Delete discount?"
            onConfirm={async () => {
              await http.delete(`/admin/discounts/${r.id}`);
              fetchList(params, pagination);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginTop: 10 }}>
        <div className="flex flex-wrap" style={{ width: "100%", alignItems: "flex-end" }}>
          <div className="flex align-center">
            <span style={{ fontSize: 12 }}>Show</span>
            <Select<number>
              style={{ width: 80, marginLeft: 10, marginRight: 10 }}
              value={pagination.pageSize as number}
              onChange={(pageSize) => {
                const next = { current: 1, pageSize, total: pagination.total ?? 0 };
                setPagination(next);
                fetchList(params, next);
              }}
              options={[
                { value: 10, label: "10" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
            />
            <span style={{ fontSize: 12 }}>entries</span>
          </div>

          <div style={{ marginLeft: "auto" }} className="flex align-center">
            <Search
              placeholder="Search Diskon (name/code)"
              onSearch={(val) => {
                const next = { q: val };
                setParams(next);
                fetchList(next, { ...pagination, current: 1 });
              }}
            />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => navigate("/discounts/new")}
              style={{ marginLeft: 10 }}
            >
              Create new
            </Button>
          </div>
        </div>
      </Card>

      <Table<DiscountRecord>
        style={{ marginTop: 10 }}
        columns={columns}
        rowKey={(r) => String(r.id)}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </>
  );
};

export default TableDiscount;
