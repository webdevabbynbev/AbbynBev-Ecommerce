import React from "react";
import {
  Table,
  Card,
  Space,
  Button,
  Tag,
  Popconfirm,
  Modal,
  Input,
  Select,
  App,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import FormCategoryType from "../../Forms/CategoryTypes/FormCategoryTypes";

export type CategoryTypeRecord = {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  level?: number | null;
  children?: CategoryTypeRecord[];
};

type ListResponse = {
  data?: { serve: CategoryTypeRecord[] };
};

type QueryParams = {
  q?: string;
};

const removeNodeById = (
  nodes: CategoryTypeRecord[],
  id: number
): CategoryTypeRecord[] => {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.children?.length
        ? { ...n, children: removeNodeById(n.children, id) }
        : n
    );
};

const collectDescendantKeys = (node: CategoryTypeRecord): number[] => {
  const out: number[] = [];
  const stack = [...(node.children || [])];
  while (stack.length) {
    const cur = stack.pop()!;
    out.push(cur.id);
    if (cur.children?.length) stack.push(...cur.children);
  }
  return out;
};

const TableCategoryTypes: React.FC = () => {
  const { message } = App.useApp();
  const [data, setData] = React.useState<CategoryTypeRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = React.useState<number[]>([]);
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<CategoryTypeRecord | undefined>(
    undefined
  );

  const [pageSize, setPageSize] = React.useState<number>(50);
  const [params, setParams] = React.useState<QueryParams>({ q: "" });

  const { Search } = Input;

  const fetchList = async (q: QueryParams = params) => {
    setLoading(true);
    try {
      const res = (await http.get(
        `/admin/category-types/list${q.q ? `?q=${encodeURIComponent(q.q)}` : ""}`
      )) as ListResponse;

      const serve = res?.data?.serve ?? [];
      setData(serve);
    } catch (e: any) {
      message.error(e?.message || "Failed load category types");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchList();
  }, []);

  const columns: ColumnsType<CategoryTypeRecord> = [
    {
      title: "Name",
      dataIndex: "name",
      render: (_: unknown, record) => (
        <Space size={8}>
          <Tag>{`L${record.level || 1}`}</Tag>
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: "Parent ID",
      dataIndex: "parentId",
      width: 120,
      align: "center",
      render: (val?: number | null) => (val ? val : "-"),
    },
    {
      title: "Children",
      dataIndex: "children",
      width: 120,
      align: "center",
      render: (children?: CategoryTypeRecord[]) => children?.length ?? 0,
    },
    {
      title: "#",
      dataIndex: "action",
      width: 180,
      align: "center",
      render: (_: unknown, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrent(record);
              setOpen(true);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            placement="left"
            title="Are you sure want to delete?"
            okText="Yes"
            cancelText="No"
            onConfirm={async () => {
                try {
                await http.delete(`/admin/category-types/${record.slug}`);
                setData((prev) => removeNodeById(prev, record.id));
                setExpandedRowKeys((prev) => prev.filter((k) => k !== record.id));
                message.success("Deleted");
                fetchList({ ...params, q: params.q });
                } catch (e: any) {
                message.error(e?.message || "Delete failed");
                }
            }}
            >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
        </Popconfirm>
        </Space>
      ),
    },
  ];

  const onExpand = (expanded: boolean, record: CategoryTypeRecord) => {
    setExpandedRowKeys((prev) => {
      if (expanded) {
        return prev.includes(record.id) ? prev : [...prev, record.id];
      }
      const descendants = collectDescendantKeys(record);
      return prev.filter((k) => k !== record.id && !descendants.includes(k));
    });
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
              style={{ width: 90, marginLeft: 10, marginRight: 10 }}
              value={pageSize}
              onChange={(val) => setPageSize(val)}
              options={[
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
            />
            <span style={{ fontSize: 12 }}>entries</span>
          </div>

          <Space style={{ marginLeft: "auto" }}>
            <Search
              allowClear
              placeholder="Search Category Type"
              onSearch={(q) => {
                const next = { q };
                setParams(next);
                fetchList(next);
                setExpandedRowKeys([]);
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCurrent(undefined);
                setOpen(true);
              }}
            >
              Create New
            </Button>
          </Space>
        </div>
      </Card>

      <Table<CategoryTypeRecord>
        style={{ marginTop: 10 }}
        rowKey={(record) => record.id}
        loading={loading}
        dataSource={data}
        columns={columns}
        expandable={{
          childrenColumnName: "children",
          expandedRowKeys,
          onExpand,
          rowExpandable: (rec) => (rec.children?.length ?? 0) > 0,
        }}
        pagination={{
          pageSize,
          showSizeChanger: false,
        }}
      />

      <Modal
        centered
        open={open}
        title={current ? "Edit Category Type" : "Create Category Type"}
        onCancel={() => {
          setOpen(false);
          setCurrent(undefined);
        }}
        footer={null}
        destroyOnClose
      >
        <FormCategoryType
          data={current}
          handleClose={() => {
            setOpen(false);
            setCurrent(undefined);
            fetchList(params);
          }}
        />
      </Modal>
    </>
  );
};

export default TableCategoryTypes;
