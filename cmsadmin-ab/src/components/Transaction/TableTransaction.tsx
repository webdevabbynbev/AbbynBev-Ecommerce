import { useEffect, useMemo, useState } from "react";
import { Button, Card, Modal, Space, Table, Tag, message, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "../../api/http";

import { pdf } from "@react-pdf/renderer";
import JsBarcode from "jsbarcode";
import LabelPdf from "./LabelPdf"; // ⬅️ pastikan file ini ada di folder yang sama

type TxUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  name?: string;
};

type TxDetail = {
  qty: number;
  product?: { name?: string };
  variant?: { sku?: string };
};

type TxShipment = {
  resiNumber?: string;
  resi_number?: string;
  service?: string;
  serviceType?: string;
  price?: number | string;
};

type Tx = {
  id: number;
  transactionNumber: string;
  transactionStatus: string;
  amount: number | string;
  createdAt?: string;
  created_at?: string;
  user?: TxUser;
  shipments?: TxShipment[];
  details?: TxDetail[];
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

function formatDate(v?: string) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID");
}

function makeBarcodeDataUrl(text: string) {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, text, {
    format: "CODE128",
    displayValue: false,
    margin: 0,
    height: 50,
  });
  return canvas.toDataURL("image/png");
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

  const downloadOrPrintLabel = async (transactionId: number, mode: "download" | "print") => {
    try {
      const { data } = await api.get(`/admin/transactions/${transactionId}`);
      const tx = data?.serve;
      if (!tx) throw new Error("Detail transaksi kosong");

      const sh = tx?.shipments?.[0];
      const resi = sh?.resiNumber || sh?.resi_number;
      if (!resi) throw new Error("Resi belum ada. Generate resi dulu.");

      const barcodeSrc = makeBarcodeDataUrl(String(resi));
      const blob = await pdf(<LabelPdf tx={tx} barcodeSrc={barcodeSrc} />).toBlob();

      const url = URL.createObjectURL(blob);

      if (mode === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = `label-${tx.transactionNumber || transactionId}.pdf`;
        a.click();
      } else {
        const w = window.open(url);
        setTimeout(() => w?.print(), 500);
      }

      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e: any) {
      message.error(e?.response?.data?.message || e.message || "Gagal buat/download label");
    }
  };

  const generateResi = (transactionId: number) => {
    Modal.confirm({
      title: "Generate Resi",
      content: "Generate resi (Biteship) dan download label A6 sekarang?",
      okText: "Generate & Download",
      cancelText: "Batal",
      onOk: async () => {
        try {
          await api.put("/admin/transactions/update-receipt", { transaction_id: transactionId });

          // auto download label setelah resi sukses
          await downloadOrPrintLabel(transactionId, "download");

          message.success("Resi berhasil dibuat dan label berhasil di-download.");
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
      {
        title: "No. Transaksi",
        dataIndex: "transactionNumber",
        key: "transactionNumber",
        width: 180,
      },
      {
        title: "Customer",
        key: "customer",
        width: 260,
        render: (_, r) => {
          const u = r.user;
          const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{name || u?.fullName || u?.name || "-"}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{u?.email || "-"}</div>
            </div>
          );
        },
      },
      {
        title: "Produk",
        key: "products",
        width: 320,
        render: (_, r) => {
          const items =
            (r.details || [])
              .map((d) => `${d.product?.name || "Item"} x${d.qty}`)
              .filter(Boolean);

          if (!items.length) return "-";

          const display = items.slice(0, 2).join(", ");
          const rest = items.length - 2;

          return (
            <div
              style={{
                maxWidth: 300,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={items.join("\n")}
            >
              {display}
              {rest > 0 ? ` +${rest} lainnya` : ""}
            </div>
          );
        },
      },
      {
        title: "Resi",
        key: "resi",
        width: 220,
        render: (_, r) => {
          const sh = r.shipments?.[0];
          const resi = sh?.resiNumber || (sh as any)?.resi_number;
          if (!resi) return "-";
          return <Typography.Text copyable>{resi}</Typography.Text>;
        },
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        width: 140,
        render: (v) => `Rp ${money(v)}`,
      },
      {
        title: "Status",
        dataIndex: "transactionStatus",
        key: "transactionStatus",
        width: 220,
        render: (s: any) => {
          const key = String(s ?? "");
          const cfg = STATUS_LABEL[key] || { text: `Unknown (${key})`, color: "default" };
          return <Tag color={cfg.color}>{cfg.text}</Tag>;
        },
      },
      {
        title: "Tanggal",
        key: "createdAt",
        width: 170,
        render: (_, r) => formatDate(r.createdAt || r.created_at),
      },
      {
        title: "Action",
        key: "action",
        width: 520,
        render: (_, r) => {
          const st = String(r.transactionStatus ?? "");
          const sh = r.shipments?.[0];
          const hasResi = Boolean(sh?.resiNumber || (sh as any)?.resi_number);

          const canConfirm = st === "5";
          const canResi = st === "2" && !hasResi;
          const canCancel = st === "1" || st === "5";

          return (
            <Space wrap>
              <Button type="primary" disabled={!canConfirm} onClick={() => confirmPaid(r.id)}>
                Confirm
              </Button>

              <Button disabled={!canResi} onClick={() => generateResi(r.id)}>
                Generate Resi
              </Button>

              <Button disabled={!hasResi} onClick={() => downloadOrPrintLabel(r.id, "download")}>
                Download Label
              </Button>

              <Button disabled={!hasResi} onClick={() => downloadOrPrintLabel(r.id, "print")}>
                Print
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
