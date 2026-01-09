import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Popconfirm,
  Select,
  Modal,
  Space,
  Tag,
  message,
} from "antd";
import type {
  ColumnsType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import http from "../../../api/http";
import FormBrand from "../../Forms/Brand/FormBrand";

export type BrandPayload = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  country?: string | null;
  website?: string | null;
  isActive?: number;
};

export type BrandRecord = BrandPayload & {
  id: number | string;
  slug: string;
};

type QueryParams = {
  q?: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: BrandRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  setOpen: (open: boolean) => void;
  setCurrent: (rec: BrandRecord | false) => void;
  fetch: () => void;
};

// --- BAGIAN YANG DIUBAH ADA DI SINI ---
const columns = (props: ColumnsCtx): ColumnsType<BrandRecord> => [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Logo ",
    dataIndex: "logoUrl",
    // Perubahan: Menggunakan tag img jika url tersedia
    render: (v?: string | null) =>
      v ? (
        <img
          src={v}
          alt="Brand Logo"
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />
      ) : (
        "-"
      ),
    responsive: ["md"],
  },
  // {
  //   title: "Website",
  //   dataIndex: "website",
  //   render: (v?: string | null) =>
  //     v ? (
  //       <a href={v} target="_blank" rel="noreferrer">
  //         {v}
  //       </a>
  //     ) : (
  //       "-"
  //     ),
  //   responsive: ["lg"],
  // },
  {
    title: "Status",
    dataIndex: "isActive",
    render: (val?: number) =>
      val === 1 ? (
        <Tag color="#41BA2D">Active</Tag>
      ) : (
        <Tag color="#FF3434">Inactive</Tag>
      ),
    align: "center",
    width: 140,
  },
  {
    title: "#",
    width: 220,
    align: "center",
    render: (_: unknown, record) => (
      <Space>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => {
            props.setCurrent(record);
            props.setOpen(true);
          }}
        >
          Edit
        </Button>

        <Popconfirm
          placement="left"
          title="Are you sure want to delete this brand?"
          okText="Yes"
          cancelText="No"
          onConfirm={async () => {
            try {
              await http.delete(`/admin/brands/${record.slug}`);
              message.success("Brand deleted");
              props.fetch();
            } catch (err: any) {
              message.error(err?.response?.data?.message || "Delete failed");
            }
          }}
        >
          <Button danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];

const TableBrand: React.FC = () => {
  const [data, setData] = React.useState<BrandRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ q: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<BrandRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { Search } = Input;

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const handleTableChange: TableProps<BrandRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/brands?page=${page?.current ?? pagination.current}&per_page=${
          page?.pageSize ?? pagination.pageSize
        }&q=${encodeURIComponent(q.q ?? "")}`
      )) as ListResponse;

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

  return (
    <>
      <Card style={{ marginTop: 10 }}>
        <div
          className="flex flex-wrap"
          style={{ width: "100%", alignItems: "flex-end" }}
        >
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

          <Space
            style={{ marginLeft: "auto" }}
            className="flex align-center mt-2"
          >
            <Search
              placeholder="Search Brand"
              onSearch={(val) => {
                const next: QueryParams = { q: val };
                setParams(next);
                fetchList(next, pagination);
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

      <Table<BrandRecord>
        style={{ marginTop: 10 }}
        columns={columns({
          setOpen: (v) => setOpen(v),
          setCurrent: (v) => setCurrent(v),
          fetch: () => fetchList(params, pagination),
        })}
        rowKey={(record) => String(record.id)}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      <Modal
        centered
        open={open}
        title={current ? "Edit Brand" : "Create Brand"}
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
        destroyOnClose
      >
        <FormBrand
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList(params, pagination);
          }}
          fetch={() => fetchList(params, pagination)}
        />
      </Modal>
    </>
  );
};

export default TableBrand;
