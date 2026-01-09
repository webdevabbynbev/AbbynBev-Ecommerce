import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Popconfirm,
  Select,
  Tag,
  Modal,
} from "antd";
import type {
  ColumnsType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import moment from "moment";
import FormVoucher from "../../Forms/Voucher/FormVoucher";
import http from "../../../api/http";
import helper from "../../../utils/helper";

type VoucherRecord = {
  id: number | string;
  name: string;
  code: string;
  price?: number;
  percentage?: number;
  maxDiscPrice?: number;
  isPercentage: 0 | 1;
  isActive: 1 | 2;
  type: 1 | 2;
  qty: number;
  startedAt: string;
  expiredAt: string;
};

type QueryParams = {
  name?: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: VoucherRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  fetch: () => void;
  setOpen: (open: boolean) => void;
  setCurrent: (rec: VoucherRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<VoucherRecord> => [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Code",
    dataIndex: "code",
  },
  {
    title: "Price",
    dataIndex: "price",
    responsive: ["lg"],
    render: (_: unknown, record) =>
      record.isPercentage === 1
        ? `${record.percentage ?? 0}% (max: Rp.${helper.formatRupiah(
            record.maxDiscPrice ?? 0
          )})`
        : `Rp.${helper.formatRupiah(record.price ?? 0)}`,
  },
  {
    title: "Status",
    dataIndex: "status",
    responsive: ["lg"],
    render: (_: unknown, record) => (
      <div className="flex flex-column align-center">
        {record.isActive === 1 ? (
          <Tag color="#2db7f5" style={{ marginRight: 0, marginBottom: 10 }}>
            ACTIVE
          </Tag>
        ) : (
          <Tag color="red" style={{ marginRight: 0, marginBottom: 10 }}>
            NON ACTIVE
          </Tag>
        )}

        <Popconfirm
          placement="left"
          title="Are you sure want to update?"
          onConfirm={async () => {
            const postData = {
              id: record.id,
              status: record.isActive === 2 ? 1 : 2,
            } as const;

            await http({
              url: "/admin/voucher/status",
              method: "PUT",
              data: postData,
            });
            props.fetch();
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button type="dashed" block size="small">
            {record.isActive === 2 ? "Set Active" : "Set Non Active"}
          </Button>
        </Popconfirm>
      </div>
    ),
  },
  {
    title: "Type",
    dataIndex: "type",
    responsive: ["lg"],
    render: (_: unknown, record) =>
      record.type === 1 ? <Tag color="green">Discount</Tag> : <Tag color="blue">Shipping</Tag>,
  },
  {
    title: "Qty",
    dataIndex: "qty",
  },
  {
    title: "Started Date",
    dataIndex: "started_at",
    responsive: ["lg"],
    render: (_: unknown, record) => moment(record.startedAt).format("DD MMM YYYY"),
  },
  {
    title: "Expired Date",
    dataIndex: "expired_at",
    responsive: ["lg"],
    render: (_: unknown, record) => moment(record.expiredAt).format("DD MMM YYYY"),
  },
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
            props.setCurrent(record);
            props.setOpen(true);
          }}
        >
          Edit
        </Button>

        <Popconfirm
          placement="left"
          title="Are you sure want to delete?"
          onConfirm={async () => {
            await http({
              url: "/admin/voucher",
              method: "DELETE",
              data: { id: record.id },
            });
            props.setCurrent(false);
            props.fetch();
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button danger key="/delete" icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      </div>
    ),
  },
];

const TableVoucher: React.FC = () => {
  const [data, setData] = React.useState<VoucherRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ name: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<VoucherRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { Search } = Input;

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const handleTableChange: TableProps<VoucherRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/voucher?name=${q.name ?? ""}&page=${
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
              defaultActiveFirstOption={false}
              onChange={(pageSize) => {
                const next = {
                  current: pagination.current ?? 1,
                  pageSize,
                  total: pagination.total ?? 0,
                };
                setPagination(next);
                fetchList(params, next);
              }}
              style={{ width: 80, marginLeft: 10, marginRight: 10 }}
              value={pagination.pageSize as number}
              options={[
                { value: 10, label: "10" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
                { value: 500, label: "500" },
              ]}
            />
            <span style={{ fontSize: 12 }}>entries</span>
          </div>

          <div style={{ marginLeft: "auto" }} className="flex align-center">
            <Search
              placeholder="Search Voucher"
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
              style={{ marginLeft: 10 }}
            >
              Create new
            </Button>
          </div>
        </div>
      </Card>

      <Table<VoucherRecord>
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
        title="Manage Voucher"
        onCancel={async () => {
          setOpen(false);
          setCurrent(false);
          fetchList(params, pagination);
        }}
        footer={null}
      >
        <FormVoucher
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList(params, pagination);
          }}
        />
      </Modal>
    </>
  );
};

export default TableVoucher;
