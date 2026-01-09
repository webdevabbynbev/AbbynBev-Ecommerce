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
} from "antd";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import FormTag from "../../Forms/Tag/FormTag";
import http from "../../../api/http";

type TagRecord = {
  id: number | string;
  name: string;
  slug: string;
};

type QueryParams = {
  name?: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: TagRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  fetch: () => void;
  setOpen: (open: boolean) => void;
  setCurrent: (rec: TagRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<TagRecord> => [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "#",
    width: "10%",
    align: "center",
    dataIndex: "action",
    render: (_: unknown, record: TagRecord) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Button
          type="primary"
          key="/edit"
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
          title="Are your sure want delete this data?"
          onConfirm={async () => {
            await http({
              url: `/admin/tags/${record.slug}`,
              method: "DELETE",
            });
            props.fetch();
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

const TableTag: React.FC = () => {
  const [data, setData] = React.useState<TagRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ name: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<TagRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { Search } = Input;

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const handleTableChange: TableProps<TagRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/tags?name=${q.name ?? ""}&page=${
          page?.current ?? pagination.current
        }&per_page=${page?.pageSize ?? pagination.pageSize}`
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
              placeholder="Search Tag"
              onSearch={(val) => {
                const next: QueryParams = { name: val };
                setParams(next);
                fetchList(next, pagination);
              }}
            />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setOpen(true)}
            >
              Create New
            </Button>
          </Space>
        </div>
      </Card>

      <Table<TagRecord>
        style={{ marginTop: 10 }}
        columns={columns({
          fetch: () => fetchList(params, pagination),
          setOpen: (v) => setOpen(v),
          setCurrent: (v) => setCurrent(v),
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
        title="Manage Tag"
        onCancel={async () => {
          setOpen(false);
          setCurrent(false);
          fetchList(params, pagination);
        }}
        footer={null}
      >
        <FormTag
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

export default TableTag;
