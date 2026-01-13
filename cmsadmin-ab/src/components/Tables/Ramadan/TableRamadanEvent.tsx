import React from "react";
import { SearchOutlined } from "@ant-design/icons";
import {
  Space,
  Card,
  Modal,
  Select,
  Table,
  Button,
  Input,
  Tag,
  Descriptions,
} from "antd";
import type {
  ColumnsType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";
import http from "../../../api/http";

// Tipe data sesuai respon API ramadan-participants
type RamadanParticipantRecord = {
  id: number | string;
  name: string;
  email: string;
  phone_number?: string;
  totalFasting: number;
  totalNotFasting: number;
  notFastingReasons?: string[];
  spinResult?: string;
};

type QueryParams = {
  name?: string;
  spin?: string;
  sort_by?: string;
  direction?: "asc" | "desc";
};

type ColumnsCtx = {
  setOpen: (open: boolean) => void;
  setCurrent: (rec: RamadanParticipantRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<RamadanParticipantRecord> => [
  {
    title: "Nama",
    dataIndex: "name",
    render: (_val, record) => (
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">{record.name}</span>
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
    title: "Hasil Spin",
    dataIndex: "spinResult",
    render: (val) => val || "-",
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
    spin: "",
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
        }&per_page=${
          page?.pageSize ?? pagination.pageSize
        }&q=${encodeURIComponent(q.name ?? "")}&spin=${encodeURIComponent(
          q.spin ?? ""
        )}`
      );

      const serve = resp?.data?.serve;

      if (serve) {
        let tableData: RamadanParticipantRecord[] = [];

        if (Array.isArray(serve.data)) {
          tableData = serve.data;
        } else if (typeof serve.data === "object" && serve.data !== null) {
          tableData = Object.values(serve.data);
        }

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
                  current: 1,
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
                const next: QueryParams = { ...params, name: val };
                setParams(next);
                const nextPagination = { ...pagination, current: 1 };
                setPagination(nextPagination);
                fetchList(next, nextPagination);
              }}
              allowClear
            />

            <Search
              placeholder="Filter Hasil Spin (nama hadiah)"
              onSearch={(val) => {
                const next: QueryParams = { ...params, spin: val };
                setParams(next);
                const nextPagination = { ...pagination, current: 1 };
                setPagination(nextPagination);
                fetchList(next, nextPagination);
              }}
              allowClear
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

      <Modal
        centered
        open={open}
        title="Participant Detail"
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
        width={700}
      >
        {current ? (
          <>
            <Descriptions
              column={1}
              size="small"
              bordered
              labelStyle={{ width: 220, fontWeight: 600 }}
              contentStyle={{ background: "#fff" }}
            >
              <Descriptions.Item label="Name">{current.name}</Descriptions.Item>
              <Descriptions.Item label="Email">
                {current.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Phone Number">
                {current.phone_number ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Spin Result">
                {current.spinResult || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Total Fasting (Puasa)">
                <Tag color="green">{current.totalFasting ?? 0} Days</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Total Exempt (Tidak Puasa)">
                <Tag color="orange">{current.totalNotFasting ?? 0} Days</Tag>
              </Descriptions.Item>
            </Descriptions>

            {current.notFastingReasons &&
            current.notFastingReasons.length > 0 ? (
              <Card
                size="small"
                style={{ marginTop: 16 }}
                title="Alasan Tidak Puasa"
              >
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {current.notFastingReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </>
        ) : null}
      </Modal>
    </>
  );
};

export default TableRamadanEvent;
