import React from "react";
import Table from "antd/es/table";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import Button from "antd/es/button";
import Input from "antd/es/input";
import Card from "antd/es/card";
import Popconfirm from "antd/es/popconfirm";
import Select from "antd/es/select";
import Modal from "antd/es/modal";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import { Col, Row, Space, message } from "antd";
import moment from "moment";
import FormAdmin from "../../Forms/Admin/FormAdmin";

type AdminRecord = {
  id: number | string;
  name: string;
  email: string;
  roleName: string;
  createdAt: string;
};

type QueryParams = {
  name?: string;
  role?: number | string | "";
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: AdminRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  fetch: () => void;
  setOpen: (open: boolean) => void;
  setOpenForm: (open: boolean) => void;
  setCurrent: (rec: AdminRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<AdminRecord> => [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Role",
    dataIndex: "roleName",
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    render: (text: string) => moment(text).format("YYYY MMMM DD HH:mm"),
  },
  {
    title: "#",
    width: "10%",
    align: "center",
    dataIndex: "action",
    render: (_: unknown, record: AdminRecord) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Button
            key="/detail"
            icon={<SearchOutlined />}
            onClick={() => {
              props.setCurrent(record);
              props.setOpen(true);
            }}
          />

          <Button
            type="primary"
            key="/edit"
            icon={<EditOutlined />}
            onClick={() => {
              props.setCurrent(record);
              props.setOpenForm(true);
            }}
          />

          <Popconfirm
            placement="left"
            title="Are you sure you want to delete this data?"
            onConfirm={async () => {
              try {
                await http({
                  url: `/admin/users/${record.id}`,
                  method: "DELETE",
                });
                props.fetch();
                message.success("Deleted successfully");
              } catch (err) {
                message.error("Delete failed");
              }
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      </div>
    ),
  },
];

const TableAdmin: React.FC = () => {
  const [data, setData] = React.useState<AdminRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({
    name: "",
    role: "",
  });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [open, setOpen] = React.useState<boolean>(false);
  const [openForm, setOpenForm] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<AdminRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { Search } = Input;

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const handleTableChange: TableProps<AdminRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/users?page=${page?.current ?? pagination.current}&per_page=${page?.pageSize ?? pagination.pageSize}&q=${q.name ?? ""}&role=${q.role ?? ""}`
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
              onChange={(e) => {
                const next = {
                  current: pagination.current ?? 1,
                  pageSize: e,
                  total: pagination.total ?? 0,
                };
                setPagination(next);
                fetchList(params, next);
              }}
              style={{ width: "80px", marginLeft: 10, marginRight: 10 }}
              value={pagination.pageSize}
            >
              <Select.Option value={10}>10</Select.Option>
              <Select.Option value={50}>50</Select.Option>
              <Select.Option value={100}>100</Select.Option>
              <Select.Option value={500}>500</Select.Option>
            </Select>
            <span style={{ fontSize: 12 }}>entries</span>
          </div>

          <Select<number>
            allowClear
            placeholder="Filter"
            style={{ width: "20%", marginLeft: "1%" }}
            onChange={(e) => {
              const nextParams: QueryParams = {
                name: params.name ?? "",
                role: e ?? "",
              };
              setParams(nextParams);
              fetchList(nextParams, pagination);
            }}
          >
            <Select.Option value={1}>Admin</Select.Option>
            <Select.Option value={3}>Gudang</Select.Option>
            <Select.Option value={4}>Finance</Select.Option>
            <Select.Option value={5}>Media</Select.Option>
            <Select.Option value={6}>Cashier dan Gudang</Select.Option>
            <Select.Option value={7}>Cashier</Select.Option>
          </Select>

          <Space
            style={{ marginLeft: "auto" }}
            className="flex align-center mt-2"
          >
            <Search
              placeholder="Search Admin"
              onSearch={(e) => {
                const nextParams: QueryParams = {
                  name: e,
                  role: params.role ?? "",
                };
                setParams(nextParams);
                fetchList(nextParams, pagination);
              }}
            />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setOpenForm(true)}
            >
              Create New
            </Button>
          </Space>
        </div>
      </Card>

      <Table<AdminRecord>
        style={{ marginTop: 10 }}
        columns={columns({
          fetch: () => fetchList(params, pagination),
          setOpen: (v) => setOpen(v),
          setOpenForm: (v) => setOpenForm(v),
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
        title={"Detail Admin"}
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
        width={600}
      >
        {current && (
          <>
            <Row style={{ marginTop: "0.5rem" }}>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Name
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.name}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Email
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.email}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Role
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.roleName}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Created At
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                {moment(current.createdAt).format("YYYY MMMM DD HH:mm")}
              </Col>
            </Row>
          </>
        )}
      </Modal>

      <Modal
        centered
        open={openForm}
        title={"Manage Admin"}
        onCancel={async () => {
          setOpenForm(false);
          setCurrent(false);
          fetchList(params, pagination);
        }}
        footer={null}
      >
        <FormAdmin
          data={current || undefined}
          handleClose={() => {
            setOpenForm(false);
            setCurrent(false);
            fetchList(params, pagination);
          }}
          // @ts-expect-error: prop exists in your component usage; keeping parity with original
          fetch={() => fetchList(params, pagination)}
        />
      </Modal>
    </>
  );
}

export default TableAdmin;
