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
  totalFasting: number;
  totalNotFasting: number;
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
  lastPage?: number;
  data: RamadanParticipantRecord[];
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
          key="detail"
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
    sort_by: "total_fasting",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const resp: any = await http.get(
        `/admin/ramadan-participants?page=${
          page?.current ?? pagination.current
        }&per_page=${page?.pageSize ?? pagination.pageSize}&q=${q.name ?? ""}`
      );

      console.log("Response Raw:", resp); // Debugging

      const serve = resp?.data?.serve;

      if (serve) {
        // ✅ FIX UTAMA: Normalisasi Data
        // Jika serve.data adalah Array, pakai langsung.
        // Jika serve.data adalah Object (misal {0: {...}, 1: {...}}), convert jadi Array.
        let tableData: RamadanParticipantRecord[] = [];

        if (Array.isArray(serve.data)) {
          tableData = serve.data;
        } else if (typeof serve.data === "object" && serve.data !== null) {
          // Konversi Object ke Array
          tableData = Object.values(serve.data);
        }

        console.log("Data Table Fixed:", tableData);

        setData(tableData);
        setPagination({
          current: Number(serve.currentPage),
          pageSize: Number(serve.perPage),
          total: Number(serve.total),
        });
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching ramadan participants:", error);
      setData([]);
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
                  current: 1, // Reset ke halaman 1 saat ubah page size
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
                // Reset ke halaman 1 saat searching
                const nextPagination = { ...pagination, current: 1 };
                setPagination(nextPagination);
                fetchList(next, nextPagination);
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
            {/* Tampilkan Alasan Jika Ada */}
            {current.notFastingReasons &&
              current.notFastingReasons.length > 0 && (
                <Row style={{ marginTop: 10 }}>
                  <Col span={10} style={{ fontWeight: "bold" }}>
                    Alasan Tidak Puasa
                  </Col>
                  <Col span={1}>:</Col>
                  <Col span={13}>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {current.notFastingReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </Col>
                </Row>
              )}
          </>
        )}
      </Modal>
    </>
  );
};

export default TableRamadanEvent;
