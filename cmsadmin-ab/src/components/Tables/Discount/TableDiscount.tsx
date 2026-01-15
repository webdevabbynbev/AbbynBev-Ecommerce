import React from "react";
import { Table, Button, Input, Card, Popconfirm, Tag, Select, message } from "antd";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import moment from "moment";
import http from "../../../api/http";
import helper from "../../../utils/helper";
import { useNavigate } from "react-router-dom";

type DiscountRecord = {
  id?: number | string | null;

  name?: string | null;
  code?: string | null;
  description?: string | null;

  valueType?: number;
  value?: string | number | null;
  maxDiscount?: string | number | null;

  appliesTo?: number;
  minOrderAmount?: string | number | null;

  isActive?: number;
  startedAt?: string | null;
  expiredAt?: string | null;

  isEcommerce?: number;
  isPos?: number;

  qty?: number | null;

  // fallback (kalau backend ngirim snake_case)
  value_type?: number;
  max_discount?: string | number | null;
  applies_to?: number;
  min_order_amount?: string | number | null;
  is_active?: number;
  started_at?: string | null;
  expired_at?: string | null;
  is_ecommerce?: number;
  is_pos?: number;
};

const appliesLabel = (v?: number) => {
  if (v === 0) return "Semua Pesanan";
  if (v === 1) return "Pesanan Minimal";
  if (v === 2) return "Koleksi Produk";
  if (v === 3) return "Varian Produk";
  if (v === 4) return "Brand";
  if (v === 5) return "Produk";
  return "-";
};

const toIdNum = (id: any) => {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// ambil nilai pertama yang ada (camelCase / snake_case)
const pick = <T,>(r: any, ...keys: string[]): T | undefined => {
  for (const k of keys) {
    const v = r?.[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
};

const normalizeRow = (r: DiscountRecord) => {
  const valueType = Number(pick<number>(r, "valueType", "value_type") ?? 1);
  const appliesTo = Number(pick<number>(r, "appliesTo", "applies_to") ?? 0);

  return {
    ...r,
    id: pick(r, "id", "discountId", "discount_id") ?? r.id,
    name: pick(r, "name") ?? r.name ?? null,
    code: pick(r, "code") ?? r.code ?? null,

    valueType,
    value: pick(r, "value", "value") ?? r.value ?? null,
    maxDiscount: pick(r, "maxDiscount", "max_discount") ?? r.maxDiscount ?? null,

    appliesTo,
    minOrderAmount: pick(r, "minOrderAmount", "min_order_amount") ?? r.minOrderAmount ?? null,

    isActive: Number(pick(r, "isActive", "is_active") ?? 0),
    isEcommerce: Number(pick(r, "isEcommerce", "is_ecommerce") ?? 0),
    isPos: Number(pick(r, "isPos", "is_pos") ?? 0),

    startedAt: pick(r, "startedAt", "started_at") ?? r.startedAt ?? null,
    expiredAt: pick(r, "expiredAt", "expired_at") ?? r.expiredAt ?? null,
  } as DiscountRecord;
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

  const warnedMissingIdRef = React.useRef(false);

  const fetchList = async (q = params, page = pagination) => {
    setLoading(true);
    try {
      const resp: any = await http.get(
        `/admin/discounts?q=${encodeURIComponent(q.q ?? "")}&page=${page.current}&per_page=${page.pageSize}`
      );

      const serve = resp?.data?.serve;
      if (serve) {
        const rows = Array.isArray(serve.data) ? serve.data : [];
        const normalized: DiscountRecord[] = rows.map((x: any) => normalizeRow(x as DiscountRecord));


        setData(normalized);

        // meta bisa beda nama, ini dibikin fallback
        setPagination({
          current: Number(serve.currentPage ?? serve.current_page ?? 1),
          pageSize: Number(serve.perPage ?? serve.per_page ?? 10),
          total: Number(serve.total ?? 0),
        });

        // kalau id kosong, kasih warning sekali
        if (
  !warnedMissingIdRef.current &&
  (normalized as DiscountRecord[]).some((r: DiscountRecord) => !toIdNum(r.id))
) {

          warnedMissingIdRef.current = true;
          message.warning("Backend list diskon tidak mengirim field 'id'. Edit/Delete butuh ID.");
        }
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
    { title: "Name", dataIndex: "name", render: (v) => v ?? "-" },
    { title: "Code", dataIndex: "code", render: (v) => v ?? "-" },
    {
      title: "Value",
      dataIndex: "value",
      render: (_: unknown, r) => {
        const vt = Number(r.valueType ?? 1);
        const val = r.value ?? 0;
        const max = r.maxDiscount ?? null;

        return vt === 1
          ? `${Number(val)}%${max ? ` (max Rp.${helper.formatRupiah(String(max))})` : ""}`
          : `Rp.${helper.formatRupiah(String(val ?? 0))}`;
      },
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
          {Number(r.isEcommerce) === 1 ? <Tag color="blue">Ecommerce</Tag> : null}
          {Number(r.isPos) === 1 ? <Tag color="green">POS</Tag> : null}
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
      render: (_: unknown, r) => {
        const active = Number(r.isActive) === 1;
        const idNum = toIdNum(r.id);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {active ? <Tag color="#2db7f5">ACTIVE</Tag> : <Tag color="red">NON ACTIVE</Tag>}

            <Popconfirm
              placement="left"
              title="Update status?"
              onConfirm={async () => {
                if (!idNum) {
                  message.error("ID diskon tidak tersedia dari API list. Fix backend supaya kirim 'id'.");
                  return;
                }
                await http.put("/admin/discounts/status", {
                  id: idNum,
                  is_active: active ? 0 : 1, // 1/0
                });
                fetchList(params, pagination);
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button type="dashed" size="small">
                {active ? "Set Non Active" : "Set Active"}
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
    {
      title: "#",
      width: "14%",
      align: "center",
      render: (_: unknown, r) => {
        const idNum = toIdNum(r.id);

        return (
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                if (!idNum) {
                  message.error("ID diskon tidak tersedia dari API list. Fix backend supaya kirim 'id'.");
                  return;
                }
                navigate(`/discounts/${idNum}`, { state: r });
              }}
            >
              Edit
            </Button>

            <Popconfirm
              placement="left"
              title="Delete discount?"
              onConfirm={async () => {
                if (!idNum) {
                  message.error("ID diskon tidak tersedia dari API list. Fix backend supaya kirim 'id'.");
                  return;
                }
                await http.delete(`/admin/discounts/${idNum}`);
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
        );
      },
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
        // rowKey aman: id > code > index
        rowKey={(r, idx) => String(r.id ?? r.code ?? idx)}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </>
  );
};

export default TableDiscount;
