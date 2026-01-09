import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Space,
  Modal,
  Popconfirm,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import http from "../../../api/http";
import FormFlashSale from "../../Forms/FlashSale/FormFlashSale";
import type { FlashSaleRecord } from "../../Forms/FlashSale/FormFlashSale";

const { Search } = Input;
const BASE_URL = "/admin/flashsales";

const TableFlashSale: React.FC = () => {
  const [rows, setRows] = React.useState<FlashSaleRecord[]>([]);
  const [filtered, setFiltered] = React.useState<FlashSaleRecord[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<FlashSaleRecord | null>(null);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await http.get(BASE_URL);
      const list: FlashSaleRecord[] = resp?.data?.serve ?? [];
      setRows(list);
      setFiltered(list);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onSearch = (q: string) => {
    if (!q) {
      setFiltered(rows);
      return;
    }
    const low = q.toLowerCase();
    setFiltered(
      rows.filter(
        (r) =>
          (r.title ?? "").toLowerCase().includes(low) ||
          (r.description ?? "").toLowerCase().includes(low)
      )
    );
  };

  const optimisticDelete = (id: number) => {
    setRows((prev) => prev.filter((x) => x.id !== id));
    setFiltered((prev) => prev.filter((x) => x.id !== id));
  };

  const columns: ColumnsType<FlashSaleRecord> = [
    {
      title: "Title",
      dataIndex: "title",
      render: (v: string | null) => v || "-",
    },
    {
      title: "Period",
      key: "period",
      render: (_, r) =>
        `${dayjs(r.startDatetime).format("DD MMM YYYY HH:mm")} — ${dayjs(r.endDatetime).format(
          "DD MMM YYYY HH:mm"
        )}`,
      responsive: ["md"],
    },
    {
      title: "Publish",
      dataIndex: "isPublish",
      width: 120,
      align: "center",
      render: (v?: boolean) =>
        v ? <Tag color="green">Published</Tag> : <Tag color="default">Draft</Tag>,
    },
    {
      title: "Products",
      key: "pcount",
      width: 120,
      align: "center",
      render: (_, r) => <Tag>{r.products?.length ?? 0}</Tag>,
      responsive: ["md"],
    },
    {
      title: "#",
      dataIndex: "action",
      width: 200,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrent(record);
              setOpen(true);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Are you sure want to delete?"
            okText="Yes"
            cancelText="No"
            onConfirm={async () => {
              try {
                await http.delete(`${BASE_URL}/${record.id}`);
                optimisticDelete(record.id);
                message.success("Deleted");
              } catch (e: any) {
                message.error(e?.response?.data?.message || "Delete failed");
              }
            }}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginTop: 10 }}>
        <div className="flex flex-wrap" style={{ width: "100%", alignItems: "flex-end" }}>
          <Space style={{ marginLeft: "auto" }} className="flex align-center mt-2">
            <Search placeholder="Search FlashSale" allowClear onSearch={onSearch} />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => {
                setCurrent(null);
                setOpen(true);
              }}
            >
              Create new
            </Button>
          </Space>
        </div>
      </Card>

      <Table<FlashSaleRecord>
        rowKey={(r) => r.id}
        columns={columns}
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 10 }}
        style={{ marginTop: 10 }}
      />

      <Modal
        centered
        open={open}
        destroyOnClose
        footer={null}
        title={current ? "Edit Flash Sale" : "Create Flash Sale"}
        onCancel={() => {
          setOpen(false);
          setCurrent(null);
        }}
      >
        <FormFlashSale
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(null);
            fetchList();
          }}
        />
      </Modal>
    </>
  );
};

export default TableFlashSale;
