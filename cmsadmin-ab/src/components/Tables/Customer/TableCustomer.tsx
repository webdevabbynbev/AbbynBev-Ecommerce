import React from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Col, Row, Space, Card, Modal, Select, Table, Button, Input } from "antd";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import moment from "moment";
import http from "../../../api/http";

type CustomerRecord = {
  id: number | string;
  name: string;
  email: string;
  phone_number?: string;
  phoneNumber?: string;
  gender?: number | null;
  dob?: string | null;
  address?: string | null;
  createdAt: string;
};

type QueryParams = {
  name?: string;
  sort_by?: string;
  direction?: "asc" | "desc";
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: CustomerRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  setOpen: (open: boolean) => void;
  setCurrent: (rec: CustomerRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<CustomerRecord> => [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Phone Number",
    dataIndex: "phone_number",
    render: (val: string | undefined, record) => val ?? record.phoneNumber ?? "-",
  },
  {
    title: "Gender",
    dataIndex: "gender",
    render: (val?: number | null) => {
      if (val === 1) return "Male";
      if (val === 2) return "Female";
      return "";
    },
  },
  {
    title: "Date of Birthday",
    dataIndex: "dob",
    render: (val?: string | null) => (val ? moment(val).format("YYYY MMMM DD") : ""),
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
    render: (_: unknown, record) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
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
      </div>
    ),
  },
];

const TableCustomer: React.FC = () => {
  const [data, setData] = React.useState<CustomerRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({
    name: "",
    sort_by: "",
    direction: "desc",
  });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<CustomerRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { Search } = Input;

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const handleTableChange: TableProps<CustomerRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/customers?page=${page?.current ?? pagination.current}&per_page=${
          page?.pageSize ?? pagination.pageSize
        }&q=${q.name ?? ""}`
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
              placeholder="Search Customer"
              onSearch={(val) => {
                const next: QueryParams = { name: val };
                setParams(next);
                fetchList(next, pagination);
              }}
            />
          </Space>
        </div>
      </Card>

      <Table<CustomerRecord>
        style={{ marginTop: 10 }}
        columns={columns({
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
        title="Detail Customer"
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
                Phone Number
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.phone_number ?? current.phoneNumber ?? "-"}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Date of Birthday
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                {current.dob ? moment(current.dob).format("YYYY MMMM DD") : ""}
              </Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Address
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.address ?? "-"}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Gender
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                {current.gender === 1 ? "Male" : current.gender === 2 ? "Female" : ""}
              </Col>
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
    </>
  );
};

export default TableCustomer;
