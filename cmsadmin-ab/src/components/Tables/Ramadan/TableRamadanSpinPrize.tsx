import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
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
}

const TableRamadanSpinPrize: React.FC = () => {
  const [data, setData] = useState<SpinPrizeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<SpinPrizeRecord | null>(null);
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

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (record?: SpinPrizeRecord) => {
    if (record) {
      setCurrent(record);
      form.setFieldsValue({
        name: record.name,
        weight: record.weight,
        is_grand: record.isGrand,
        is_active: record.isActive,
      });
    } else {
      setCurrent(null);
      form.resetFields();
      form.setFieldsValue({ weight: 1, is_grand: false, is_active: true });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (current) {
        await http.put(`/admin/ramadan-spin-prizes/${current.id}`, values);
        message.success("Hadiah diperbarui.");
      } else {
        await http.post("/admin/ramadan-spin-prizes", values);
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
      title: "Bobot",
      dataIndex: "weight",
      key: "weight",
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
          <Form.Item label="Bobot" name="weight" initialValue={1}>
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
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TableRamadanSpinPrize;
