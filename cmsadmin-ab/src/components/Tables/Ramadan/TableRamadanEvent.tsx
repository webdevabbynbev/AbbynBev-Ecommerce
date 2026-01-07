import React from "react";
import { SearchOutlined } from "@ant-design/icons";
import {
  Col,
  Row,
  Space,
  Card,
  Modal,
  Select,
  Table,
  Button,
  Input,
  Tag,
} from "antd";
import type {
  ColumnsType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";
import http from "../../../api/http";

// Tipe data sesuai dengan respon API ramadan-participants
type RamadanParticipantRecord = {
  id: number | string;
  name: string;
  email: string;
  phone_number?: string;
  totalFasting: number; // Jumlah Check-in Puasa
  totalNotFasting: number; // Jumlah Izin Tidak Puasa (Exempt)
  notFastingReasons?: string[];
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
  data: RamadanParticipantRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  setOpen: (open: boolean) => void;
  setCurrent: (rec: RamadanParticipantRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<RamadanParticipantRecord> => [
  {
    title: "Name",
    dataIndex: "name",
    render: (val, record) => (
      <div className="flex flex-col">
        <span className="font-semibold">{val}</span>
        <span className="text-xs text-gray-400">{record.email}</span>
      </div>
    ),
  },
  {
    title: "Phone Number",
    dataIndex: "phone_number",
    render: (val) => val || "-",
  },
  {
    title: "Total Puasa",
    dataIndex: "totalFasting",
    align: "center",
    render: (val) => (
      <Tag color="green" style={{ minWidth: 40, textAlign: "center" }}>
        {val ?? 0}
      </Tag>
    ),
  },
  {
    title: "Total Tidak Puasa",
    dataIndex: "totalNotFasting",
    align: "center",
    render: (val) => (
      <Tag color="orange" style={{ minWidth: 40, textAlign: "center" }}>
        {val ?? 0}
      </Tag>
    ),
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

const TableRamadanEvent: React.FC = () => {
  const [data, setData] = React.useState<RamadanParticipantRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({
    name: "",
    sort_by: "total_fasting", // Default sort by fasting count
    direction: "desc",
  });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<
    RamadanParticipantRecord | false
  >(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { Search } = Input;

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const handleTableChange: TableProps<RamadanParticipantRecord>["onChange"] = (
    page
  ) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      // ✅ UPDATE: Menggunakan endpoint /admin/ramadan-participants
      const resp = (await http.get(
        `/admin/ramadan-participants?page=${
          page?.current ?? pagination.current
        }&per_page=${page?.pageSize ?? pagination.pageSize}&q=${q.name ?? ""}`
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
    } catch (error) {
      console.error("Error fetching ramadan participants:", error);
      // Tampilkan error tapi jangan crash
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

          <Space
            style={{ marginLeft: "auto" }}
            className="flex align-center mt-2"
          >
            <Search
              placeholder="Search Participant Name"
              onSearch={(val) => {
                const next: QueryParams = { name: val };
                setParams(next);
                fetchList(next, pagination);
              }}
            />
          </Space>
        </div>
      </Card>

      <Table<RamadanParticipantRecord>
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

      {/* Modal Detail */}
      <Modal
        centered
        open={open}
        title="Participant Detail"
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
              <Col span={10} style={{ fontWeight: "bold" }}>
                Name
              </Col>
              <Col span={1}>:</Col>
              <Col span={13}>{current.name}</Col>
            </Row>
            <Row>
              <Col span={10} style={{ fontWeight: "bold" }}>
                Email
              </Col>
              <Col span={1}>:</Col>
              <Col span={13}>{current.email}</Col>
            </Row>
            <Row>
              <Col span={10} style={{ fontWeight: "bold" }}>
                Phone Number
              </Col>
              <Col span={1}>:</Col>
              <Col span={13}>{current.phone_number ?? "-"}</Col>
            </Row>
            <div className="my-4 border-t border-gray-200" />
            <Row>
              <Col span={10} style={{ fontWeight: "bold" }}>
                Total Fasting (Puasa)
              </Col>
              <Col span={1}>:</Col>
              <Col span={13}>
                <Tag color="green">{current.totalFasting} Days</Tag>
              </Col>
            </Row>
            <Row>
              <Col span={10} style={{ fontWeight: "bold" }}>
                Total Exempt (Tidak Puasa)
              </Col>
              <Col span={1}>:</Col>
              <Col span={13}>
                <Tag color="orange">{current.totalNotFasting} Days</Tag>
              </Col>
            </Row>
          </>
        )}
      </Modal>
    </>
  );
};

export default TableRamadanEvent;
