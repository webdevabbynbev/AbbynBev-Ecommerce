import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Select,
  Modal,
  Space,
  Popconfirm,
  Tag,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from "@ant-design/icons";
import http from "../../../api/http";
import FormConcern from "../../Forms/Concern/FormConcern";
import type { ConcernRecord } from "../../Forms/Concern/FormConcern";
import TableConcernOption from "../Concern/TableConcernOption";

type QueryParams = { q?: string };

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: (ConcernRecord & { options?: Array<any> })[];
};

type ListResponse = {
  data?: { serve: ServePayload };
};

const { Search } = Input;

const TableConcern: React.FC = () => {
  const [data, setData] = React.useState<(ConcernRecord & { options?: any[] })[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ q: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<ConcernRecord | false>(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerConcern, setDrawerConcern] = React.useState<ConcernRecord | null>(null);

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const fetchList = async (q: QueryParams = params, page?: TablePaginationConfig) => {
    setLoading(true);
    try {
      const url = `/admin/concern?q=${encodeURIComponent(q.q ?? "")}&page=${
        page?.current ?? pagination.current
      }&per_page=${page?.pageSize ?? pagination.pageSize}`;
      const resp = (await http.get(url)) as ListResponse;

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setPagination({
          current: Number(serve.currentPage),
          pageSize: Number(serve.perPage),
          total: Number(serve.total),
        });
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange: TableProps<ConcernRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const optimisticRemove = (slug: string) => {
    setData((prev) => prev.filter((x) => x.slug !== slug));
  };

  const columns: ColumnsType<ConcernRecord & { options?: any[] }> = [
    { title: "Name", dataIndex: "name" },
    {
      title: "Description",
      dataIndex: "description",
      render: (val?: string) => val || "-",
      responsive: ["md"],
    },
    {
      title: "Position",
      dataIndex: "position",
      render: (val?: number) => (typeof val === "number" ? val : "-"),
      width: 110,
      align: "center",
      responsive: ["md"],
    },
    {
      title: "Options",
      key: "optcount",
      width: 110,
      align: "center",
      render: (_, record) => <Tag>{record.options?.length ?? 0}</Tag>,
    },
    {
      title: "#",
      dataIndex: "action",
      width: 220,
      align: "center",
      render: (_: unknown, record) => (
        <Space>
          <Button
            icon={<ApartmentOutlined />}
            onClick={() => {
              setDrawerConcern(record);
              setDrawerOpen(true);
            }}
          >
            Options
          </Button>
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
                await http.delete(`/admin/concern/${record.slug}`);
                optimisticRemove(record.slug);
                message.success("Deleted");
                fetchList(params, pagination);
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
          <div className="flex align-center">
            <span style={{ fontSize: 12 }}>Show</span>
            <Select<number>
              style={{ width: 80, marginLeft: 10, marginRight: 10 }}
              value={pagination.pageSize as number}
              onChange={(pageSize) => {
                const next = {
                  current: pagination.current ?? 1,
                  pageSize,
                  total: pagination.total ?? 0,
                };
                setPagination(next);
                fetchList(params, next);
              }}
              options={[
                { value: 10, label: "10" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
                { value: 500, label: "500" },
              ]}
            />
            <span style={{ fontSize: 12 }}>entries</span>
          </div>

          <Space style={{ marginLeft: "auto" }} className="flex align-center mt-2">
            <Search
              placeholder="Search Concern"
              allowClear
              onSearch={(val) => {
                const next = { q: val };
                setParams(next);
                fetchList(next, { ...pagination, current: 1 });
              }}
            />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => {
                setCurrent(false);
                setOpen(true);
              }}
            >
              Create New
            </Button>
          </Space>
        </div>
      </Card>

      <Table
        style={{ marginTop: 10 }}
        rowKey={(r) => r.slug}
        dataSource={data}
        columns={columns}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      <Modal
        centered
        open={open}
        title={current ? "Edit Concern" : "Create Concern"}
        destroyOnClose
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
      >
        <FormConcern
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList(params, pagination);
          }}
        />
      </Modal>

      <Modal
        open={drawerOpen}
        onCancel={() => {
          setDrawerOpen(false);
          setDrawerConcern(null);
        }}
        footer={null}
        width={900}
        title={
          <span>
            Concern Options — <strong>{drawerConcern?.name || "-"}</strong>
          </span>
        }
        destroyOnClose
      >
        {drawerConcern && (
          <TableConcernOption concernId={drawerConcern.id} concernName={drawerConcern.name} />
        )}
      </Modal>
    </>
  );
};

export default TableConcern;
