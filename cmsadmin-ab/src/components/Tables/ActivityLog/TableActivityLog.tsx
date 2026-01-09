import React from "react";
import { Table, Button, Input, Card, Select, Modal, Col, Row, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import http from "../../../api/http";

type ActivityLogRecord = {
  id: number | string;
  roleName: string;
  userName: string;
  activity: string;
  data_array?: Record<string, any>;
};

type QueryParams = {
  name?: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: ActivityLogRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  setCurrent: (rec: ActivityLogRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<ActivityLogRecord> => [
  {
    title: "Role Name",
    dataIndex: "roleName",
  },
  {
    title: "Name",
    dataIndex: "userName",
  },
  {
    title: "Activity",
    dataIndex: "activity",
  },
  {
    title: "#",
    width: "10%",
    align: "center",
    dataIndex: "action",
    render: (_: unknown, record: ActivityLogRecord) => (
      <Button
        key="/detail"
        icon={<SearchOutlined />}
        onClick={() => {
          props.setCurrent(record);
        }}
      />
    ),
  },
];

const TableActivityLog: React.FC = () => {
  const [data, setData] = React.useState<ActivityLogRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ name: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [current, setCurrent] = React.useState<ActivityLogRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { Search } = Input;

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const handleTableChange: TableProps<ActivityLogRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/activity-logs?q=${q.name ?? ""}&page=${
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

          {}
          <Space style={{ marginLeft: "auto" }}>
            <Search
              placeholder="Search activity"
              onSearch={(val) => {
                const next: QueryParams = { name: val };
                setParams(next);
                fetchList(next, pagination);
              }}
              allowClear
              style={{ width: 250 }}
            />
          </Space>
        </div>
      </Card>

      <Table<ActivityLogRecord>
        style={{ marginTop: 10 }}
        columns={columns({
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
        open={!!current}
        title="Detail Activity Log"
        onCancel={() => setCurrent(false)}
        footer={null}
        width={600}
      >
        {current && (
          <>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Role Name
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.roleName}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                User
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.userName}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Activity
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.activity}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Data
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                <ul>
                  {current.data_array &&
                    Object.entries(current.data_array).map(([key, value]) => {
                      if (typeof value === "object" && value !== null) {
                        return (
                          <li key={key}>
                            <strong>{key}</strong>
                            <ul>
                              {Object.entries(value).map(([subKey, subValue]) => (
                                <li key={subKey}>
                                  <strong>{subKey}:</strong> {String(subValue)}
                                </li>
                              ))}
                            </ul>
                          </li>
                        );
                      }
                      return (
                        <li key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </li>
                      );
                    })}
                </ul>
              </Col>
            </Row>
          </>
        )}
      </Modal>
    </>
  );
};

export default TableActivityLog;
