import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Select,
  Modal,
  Space,
  Popconfirm,
  message,
  Tag,
} from "antd";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import http from "../../../api/http";
import FormProfileCategoryOption from "../../Forms/ProfileCategory/FormProfileCategoryOption";
import type { ProfileCategoryOptionRecord } from "../../Forms/ProfileCategory/FormProfileCategoryOption";

type QueryParams = {
  q?: string;
  active_only?: boolean;
  trashed_only?: boolean;
};

type Row = ProfileCategoryOptionRecord & { category?: { id: number; name: string } };

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: Row[];
};
type ListResponseServe = {
  data?: { serve: ServePayload };
};

type MetaPayload = { total: number; perPage: number; currentPage: number };
type ListResponseMeta = {
  data?: { status?: boolean; message?: string; data: Row[]; meta: MetaPayload };
};

const { Search } = Input;

type Props = {
  categoryId?: number;
  categoryName?: string;
};

const TableProfileCategoryOption: React.FC<Props> = ({ categoryId }) => {
  const [data, setData] = React.useState<Row[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ q: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<ProfileCategoryOptionRecord | false>(false);

  React.useEffect(() => {
    const pageCfg: TablePaginationConfig = categoryId
      ? { current: 1, pageSize: 9999, total: 0 }
      : pagination;

    fetchList(params, pageCfg);
  }, [categoryId]);

  const parseListResponse = (resp: ListResponseServe & ListResponseMeta) => {
    const serve = (resp as ListResponseServe)?.data?.serve;
    if (serve) {
      return {
        rows: serve.data || [],
        meta: {
          current: Number(serve.currentPage),
          pageSize: Number(serve.perPage),
          total: Number(serve.total),
        },
      };
    }
    const r2 = (resp as ListResponseMeta)?.data;
    if (r2 && Array.isArray(r2.data) && r2.meta) {
      return {
        rows: r2.data || [],
        meta: {
          current: Number(r2.meta.currentPage),
          pageSize: Number(r2.meta.perPage),
          total: Number(r2.meta.total),
        },
      };
    }
    return {
      rows: [] as Row[],
      meta: { current: 1, pageSize: 10, total: 0 },
    };
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ): Promise<void> => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q.q) qs.set("q", q.q);
      if (q.active_only) qs.set("active_only", "true");
      if (q.trashed_only) qs.set("trashed_only", "true");

      const effectivePageSize = categoryId ? 9999 : page?.pageSize ?? pagination.pageSize;
      const effectivePage = categoryId ? 1 : page?.current ?? pagination.current;

      qs.set("page", String(effectivePage));
      qs.set("per_page", String(effectivePageSize));

      const resp = (await http.get(
        `/admin/profile-category-options?${qs.toString()}`
      )) as ListResponseServe & ListResponseMeta;

      const parsed = parseListResponse(resp);
      let rows = parsed.rows;

      if (categoryId) {
        rows = rows.filter((r) => r.category?.id === categoryId);
      }

      setData(rows);
      setPagination({
        current: categoryId ? 1 : parsed.meta.current,
        pageSize: categoryId ? 10 : parsed.meta.pageSize,
        total: categoryId ? rows.length : parsed.meta.total,
      });
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange: TableProps<Row>["onChange"] = (page) => {
    if (categoryId) {
      setPagination((prev) => ({ ...prev, current: page.current, pageSize: page.pageSize }));
      return;
    }
    fetchList(params, page as TablePaginationConfig);
  };

  const optimisticRemove = (id: number) => {
    setData((prev) => prev.filter((x) => x.id !== id));
    setPagination((prev) => ({ ...prev, total: Math.max(0, (prev.total as number) - 1) }));
  };

  const columns: ColumnsType<Row> = [
    !categoryId
      ? {
          title: "Category",
          dataIndex: ["category", "name"],
          render: (val?: string) => val ?? "-",
          responsive: ["md"],
        }
      : {
          title: "Category",
          dataIndex: ["category", "name"],
          render: () => <Tag>Current</Tag>,
          responsive: ["md"],
        },
    { title: "Label", dataIndex: "label" },
    { title: "Value", dataIndex: "value", responsive: ["md"] },
    {
      title: "Active",
      dataIndex: "isActive",
      width: 100,
      align: "center",
      render: (v?: boolean) => (v ? <Tag color="#41BA2D">Active</Tag> : <Tag color="#FF3434">Inactive</Tag>),
      responsive: ["md"],
    },
    {
      title: "#",
      width: 170,
      align: "center",
      render: (_: unknown, record: Row) => (
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
            title="Are you sure want to delete?"
            okText="Yes"
            cancelText="No"
            onConfirm={async () => {
              try {
                await http.delete(`/admin/profile-category-options/${record.id}`);
                optimisticRemove(record.id);
                message.success("Deleted");
                if (!categoryId) {
                  fetchList(params, pagination);
                }
              } catch (e: any) {
                message.error(e?.response?.data?.message || "Delete failed");
              }
            }}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(Boolean) as ColumnsType<Row>;

  return (
    <>
      {}
      {!categoryId && (
        <Card style={{ marginTop: 10 }}>
          <div className="flex flex-wrap" style={{ width: "100%", alignItems: "flex-end" }}>
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
                placeholder="Search Profile Category Option"
                allowClear
                onSearch={(val) => {
                  const next = { ...params, q: val };
                  setParams(next);
                  fetchList(next, { ...pagination, current: 1 });
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
      )}

      <Table<Row>
        rowKey={(r) => String(r.id)}
        dataSource={data}
        columns={columns}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        style={{ marginTop: categoryId ? 0 : 10 }}
      />

      <Modal
        centered
        open={open}
        title={current ? "Edit Profile Category Option" : "Create Profile Category Option"}
        destroyOnClose
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
      >
        <FormProfileCategoryOption
          data={current || undefined}
          categoryId={categoryId}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            if (categoryId) {
              fetchList(params, { current: 1, pageSize: 9999 });
            } else {
              fetchList(params, pagination);
            }
          }}
        />
      </Modal>
    </>
  );
};

export default TableProfileCategoryOption;
