import { useEffect, useMemo, useState } from "react";
import { Button, Card, Modal, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "../../api/http"; // ✅ pakai axios instance CMS yang sudah pasang token dari "session"

type TxUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type Tx = {
  id: number;
  transactionNumber: string;
  transactionStatus: string;
  amount: number | string;
  createdAt?: string;
  created_at?: string;
  user?: TxUser;
  shipments?: any[];
};

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  "1": { text: "Belum Bayar", color: "orange" },
  "5": { text: "Sudah Bayar (Menunggu Admin)", color: "blue" },
  "2": { text: "Diproses", color: "purple" },
  "3": { text: "Dikirim", color: "green" },
  "4": { text: "Selesai", color: "green" },
  "9": { text: "Gagal", color: "red" },
};

function money(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "");
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function TableTransaction() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Tx[]>([]);
  const [meta, setMeta] = useState<{ total?: number; per_page?: number; current_page?: number }>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/transactions", {
        params: { page, per_page: perPage },
      });

      const serve = data?.serve;
      setRows(serve?.data || []);
      setMeta({
        total: serve?.total,
        per_page: serve?.per_page,
        current_page: serve?.current_page,
      });
    } catch (e: any) {
      message.error(e?.response?.data?.message || e.message || "Gagal ambil data transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const confirmPaid = (transactionId: number) => {
    Modal.confirm({
      title: "Konfirmasi Pesanan",
      content: "Yakin pesanan ini sudah dicek dan mau diproses?",
      okText: "Ya, Konfirmasi",
      cancelText: "Batal",
      onOk: async () => {
        try {
          await api.put("/admin/transactions/confirm", { transaction_id: transactionId });
          message.success("Pesanan berhasil dikonfirmasi.");
          fetchData();
        } catch (e: any) {
          message.error(e?.response?.data?.message || e.message || "Gagal confirm pesanan");
        }
      },
    });
  };

  const generateResi = (transactionId: number) => {
    Modal.confirm({
      title: "Generate Resi",
      content: "Yakin mau generate resi (Komerce) untuk pesanan ini?",
      okText: "Generate",
      cancelText: "Batal",
      onOk: async () => {
        try {
          await api.put("/admin/transactions/update-receipt", { transaction_id: transactionId });
          message.success("Resi berhasil dibuat, status jadi Dikirim.");
          fetchData();
        } catch (e: any) {
          message.error(e?.response?.data?.message || e.message || "Gagal generate resi");
        }
      },
    });
  };

  const cancelTx = (transactionId: number) => {
    Modal.confirm({
      title: "Cancel Transaksi",
      content: "Yakin mau cancel transaksi ini?",
      okText: "Cancel",
      okButtonProps: { danger: true },
      cancelText: "Batal",
      onOk: async () => {
        try {
          await api.put("/admin/transactions/cancel", { transactionIds: [transactionId] });
          message.success("Transaksi dibatalkan.");
          fetchData();
        } catch (e: any) {
          message.error(e?.response?.data?.message || e.message || "Gagal cancel transaksi");
        }
      },
    });
  };

  const columns: ColumnsType<Tx> = useMemo(
    () => [
      { title: "No. Transaksi", dataIndex: "transactionNumber", key: "transactionNumber", width: 180 },
      {
        title: "Customer",
        key: "customer",
        render: (_, r) => {
          const u = r.user;
          const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{name || "-"}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{u?.email || "-"}</div>
            </div>
          );
        },
      },
      { title: "Amount", dataIndex: "amount", key: "amount", width: 140, render: (v) => `Rp ${money(v)}` },
      {
        title: "Status",
        dataIndex: "transactionStatus",
        key: "transactionStatus",
        width: 240,
        render: (s: any) => {
          const key = String(s ?? "");
          const cfg = STATUS_LABEL[key] || { text: `Unknown (${key})`, color: "default" };
          return <Tag color={cfg.color}>{cfg.text}</Tag>;
        },
      },
      {
        title: "Tanggal",
        key: "createdAt",
        width: 160,
        render: (_, r) => {
          const v = r.createdAt || r.created_at;
          if (!v) return "-";
          return new Date(v).toLocaleString("id-ID");
        },
      },
      {
        title: "Action",
        key: "action",
        width: 320,
        render: (_, r) => {
          const st = String(r.transactionStatus ?? "");
          const canConfirm = st === "5";
          const canResi = st === "2";
          const canCancel = st === "1" || st === "5";

          return (
            <Space wrap>
              <Button type="primary" disabled={!canConfirm} onClick={() => confirmPaid(r.id)}>
                Confirm
              </Button>
              <Button disabled={!canResi} onClick={() => generateResi(r.id)}>
                Generate Resi
              </Button>
              <Button danger disabled={!canCancel} onClick={() => cancelTx(r.id)}>
                Cancel
              </Button>
            </Space>
          );
        },
      },
    ],
    []
  );

  return (
    <Card style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Transactions</h3>
        <Button onClick={fetchData}>Refresh</Button>
      </div>

      <Table<Tx>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page,
          pageSize: perPage,
          total: meta.total || 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPerPage(ps);
          },
        }}
      />
    </Card>
  );
}
