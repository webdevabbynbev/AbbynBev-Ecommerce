import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ValidateErrorEntity } from "rc-field-form/lib/interface";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import http from "../../../api/http";

interface SpinPrizeRecord {
  id: number;
  name: string;
  weight: number;
  isGrand: boolean;
  isActive: boolean;
  dailyQuota?: number | null;
  voucherId?: number | null;
  voucherQty?: number;
}

interface VoucherRecord {
  id: number | string;
  name: string;
  code: string;
}

interface VoucherResponse {
  data?: {
    serve?: {
      data?: VoucherRecord[];
    };
  };
}
interface VoucherRecord {
  id: number | string;
  name: string;
  code: string;
}

interface VoucherResponse {
  data?: {
    serve?: {
      data?: VoucherRecord[];
    };
  };
}
const TableRamadanSpinPrize: React.FC = () => {
  const [data, setData] = useState<SpinPrizeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<SpinPrizeRecord | null>(null);
  const [voucherOptions, setVoucherOptions] = useState<VoucherRecord[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await http.get(
        "/admin/ramadan-spin-prizes?page=1&per_page=50"
      );
      setData(res.data?.data || []);
    } catch (error) {
      message.error("Gagal memuat hadiah spin.");
    } finally {
      setLoading(false);
    }
  };
  const fetchVouchers = async () => {
    try {
      const res = (await http.get(
        "/admin/voucher?page=1&per_page=1000"
      )) as VoucherResponse;
      setVoucherOptions(res.data?.serve?.data || []);
    } catch (error) {
      message.error("Gagal memuat voucher.");
    }
  };
  useEffect(() => {
    fetchData();
    fetchVouchers();
  }, []);

  const openModal = (record?: SpinPrizeRecord) => {
    if (record) {
      const matchedVoucher = voucherOptions.find(
        (voucher) => voucher.id === record.voucherId
      );
      const fallbackVoucher = matchedVoucher
        ? undefined
        : voucherOptions.find((voucher) => voucher.name === record.name);

      setCurrent(record);
      form.setFieldsValue({
        name: record.name,
        weight: record.weight,
        is_grand: record.isGrand,
        is_active: record.isActive,
        voucher_id: matchedVoucher?.id ?? fallbackVoucher?.id,
        voucher_qty: record.voucherQty ?? undefined,
        daily_quota: record.dailyQuota ?? undefined,
      });
    } else {
      setCurrent(null);
      form.resetFields();
      form.setFieldsValue({
        weight: 1,
        is_grand: false,
        is_active: true,
        daily_quota: undefined,
        voucher_qty: undefined,
      });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values } as Record<string, unknown>;
      if (!payload.voucher_id) {
        payload.voucher_id = null;
        payload.voucher_qty = 0;
      }
      if (current) {
        await http.put(`/admin/ramadan-spin-prizes/${current.id}`, payload);
        message.success("Hadiah diperbarui.");
      } else {
        await http.post("/admin/ramadan-spin-prizes", payload);
        message.success("Hadiah ditambahkan.");
      }
      setOpen(false);
      fetchData();
    } catch (error) {
      if ((error as ValidateErrorEntity)?.errorFields) return;
      message.error("Gagal menyimpan hadiah.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus hadiah ini?")) return;
    try {
      await http.delete(`/admin/ramadan-spin-prizes/${id}`);
      message.success("Hadiah dihapus.");
      fetchData();
    } catch (error) {
      message.error("Gagal menghapus hadiah.");
    }
  };

  const columns = [
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Kuota Hari Ini",
      dataIndex: "dailyQuota",
      key: "dailyQuota",
      render: (value: number | null | undefined) => value ?? "-",
    },
    {
      title: "Bobot",
      dataIndex: "weight",
      key: "weight",
    },
    {
      title: "Voucher Qty",
      dataIndex: "voucherQty",
      key: "voucherQty",
      render: (value: number | undefined) => value ?? "-",
    },
    {
      title: "Grand Prize",
      dataIndex: "isGrand",
      key: "isGrand",
      render: (value: boolean) =>
        value ? <Tag color="gold">Ya</Tag> : <Tag>Normal</Tag>,
    },
    {
      title: "Aktif",
      dataIndex: "isActive",
      key: "isActive",
      render: (value: boolean) =>
        value ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="red">Nonaktif</Tag>
        ),
    },
    {
      title: "Aksi",
      key: "action",
      render: (_: unknown, record: SpinPrizeRecord) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)} />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Input Roulette Check-in Ramadan"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
        >
          Tambah Hadiah
        </Button>
      }
    >
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={current ? "Edit Hadiah" : "Tambah Hadiah"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Nama Hadiah"
            name="name"
            rules={[{ required: true, message: "Nama hadiah wajib diisi" }]}
          >
            <Input placeholder="Contoh: Voucher 50%" />
          </Form.Item>
          <Form.Item label="Voucher" name="voucher_id">
            <Select
              allowClear
              placeholder="Pilih voucher dari daftar"
              options={voucherOptions.map((voucher) => ({
                label: `${voucher.name} (${voucher.code})`,
                value: voucher.id,
              }))}
              onChange={(value) => {
                const selectedVoucher = voucherOptions.find(
                  (voucher) => voucher.id === value
                );
                if (selectedVoucher) {
                  form.setFieldsValue({ name: selectedVoucher.name });
                }
              }}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            shouldUpdate={(prev, next) => prev.voucher_id !== next.voucher_id}
          >
            {({ getFieldValue }) => {
              const hasVoucher = Boolean(getFieldValue("voucher_id"));
              return (
                <Form.Item
                  label="Jumlah Voucher"
                  name="voucher_qty"
                  rules={
                    hasVoucher
                      ? [
                          {
                            required: true,
                            message: "Jumlah voucher wajib diisi",
                          },
                        ]
                      : []
                  }
                  help="Jumlah voucher ini akan mengurangi stok voucher di master."
                >
                  <InputNumber
                    min={1}
                    style={{ width: "100%" }}
                    disabled={!hasVoucher}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item
            label="Kuota Hadiah Hari Ini"
            name="daily_quota"
            help="Jika diisi, hadiah ini hanya bisa keluar sebanyak kuota hari ini."
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Bobot"
            name="weight"
            initialValue={1}
            rules={[{ required: true, message: "Bobot wajib diisi" }]}
            help="Semakin besar bobot, semakin besar peluang hadiah keluar."
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Grand Prize"
            name="is_grand"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item label="Aktif" name="is_active" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>{" "}
        </Form>
      </Modal>
    </Card>
  );
};

export default TableRamadanSpinPrize;
