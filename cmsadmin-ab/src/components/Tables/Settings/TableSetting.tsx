import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Select,
  Modal,
  Space,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import http from "../../../api/http";
import FormSetting from "../../Forms/Settings/FormSetting";

type SettingRecord = {
  id: number | string;
  key: string;
  group: string;
  value: string;
};

type QueryParams = {
  name?: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: SettingRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  setOpen: (open: boolean) => void;
  setCurrent: (rec: SettingRecord | false) => void;
  fetch: () => void;
};

const buildColumns = (ctx: ColumnsCtx): ColumnsType<SettingRecord> => [
  { title: "Key", dataIndex: "key" },
  { title: "Group", dataIndex: "group" },
  { title: "Value", dataIndex: "value" },
  {
    title: "#",
    width: "10%",
    align: "center",
    dataIndex: "action",
    render: (_: unknown, record) => (
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
            ctx.setCurrent(record);
            ctx.setOpen(true);
          }}
        >
          Edit
        </Button>
      </div>
    ),
  },
];

const TableSetting: React.FC = () => {
  const [data, setData] = React.useState<SettingRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ name: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<SettingRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);

  const { Search } = Input;

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const handleTableChange: TableProps<SettingRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/settings?name=${q.name ?? ""}&page=${
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
    } catch (e) {
      console.error(e);
      message.error("Failed to load settings.");
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

          <Space style={{ marginLeft: "auto" }} className="flex align-center mt-2">
            <Search
              placeholder="Search Settings"
              onSearch={(val) => {
                const next: QueryParams = { name: val };
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

      <Table<SettingRecord>
        style={{ marginTop: 10 }}
        columns={buildColumns({
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
        title="Manage Setting"
        onCancel={async () => {
          setOpen(false);
          setCurrent(false);
          fetchList(params, pagination);
        }}
        footer={null}
        destroyOnClose
      >
        <FormSetting
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

export default TableSetting;
