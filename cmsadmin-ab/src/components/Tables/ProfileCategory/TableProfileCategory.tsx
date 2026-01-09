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
  Tag,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig, TableProps } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import FormProfileCategory from "../../Forms/ProfileCategory/FormProfileCategory";
import type { ProfileCategoryRecord } from "../../Forms/ProfileCategory/FormProfileCategory";
import TableProfileCategoryOption from "./TableProfileCategoryOption";

type QueryParams = { q?: string };

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: (ProfileCategoryRecord & { options?: Array<any> })[];
};

type ListResponseServe = {
  data?: { serve: ServePayload };
};

type MetaPayload = {
  total: number;
  perPage: number;
  currentPage: number;
};
type ListResponseMeta = {
  data?: {
    status?: boolean;
    message?: string;
    data: (ProfileCategoryRecord & { options?: Array<any> })[];
    meta: MetaPayload;
  };
};

const { Search } = Input;

const TableProfileCategory: React.FC = () => {
  const [data, setData] = React.useState<(ProfileCategoryRecord & { options?: any[] })[]>(
    []
  );
  const [params, setParams] = React.useState<QueryParams>({ q: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<ProfileCategoryRecord | false>(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerCategory, setDrawerCategory] = React.useState<ProfileCategoryRecord | null>(
    null
  );

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ): Promise<void> => {
    setLoading(true);
    try {
      const url = `/admin/profile-categories?q=${encodeURIComponent(
        q.q ?? ""
      )}&page=${page?.current ?? pagination.current}&per_page=${
        page?.pageSize ?? pagination.pageSize
      }`;

      const resp = (await http.get(url)) as ListResponseServe & ListResponseMeta;
      const serve = (resp as ListResponseServe)?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setPagination({
          current: Number(serve.currentPage),
          pageSize: Number(serve.perPage),
          total: Number(serve.total),
        });
        return;
      }

      const r2 = (resp as ListResponseMeta)?.data;
      if (r2 && Array.isArray(r2.data) && r2.meta) {
        setData(r2.data || []);
        setPagination({
          current: Number(r2.meta.currentPage),
          pageSize: Number(r2.meta.perPage),
          total: Number(r2.meta.total),
        });
        return;
      }
      setData([]);
      setPagination((p) => ({ ...p, total: 0 }));
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange: TableProps<ProfileCategoryRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const optimisticRemove = (id: number) => {
    setData((prev) => prev.filter((x) => x.id !== id));
  };

  const columns: ColumnsType<ProfileCategoryRecord & { options?: any[] }> = [
    { title: "Name", dataIndex: "name" },
    {
      title: "Type",
      dataIndex: "type",
      render: (val?: string | null) => val || "-",
      responsive: ["md"],
    },
    {
      title: "Options",
      key: "optcount",
      width: 110,
      align: "center",
      render: (_, record) => <Tag>{record.options?.length ?? 0}</Tag>,
    },
    {
      title: "#",
      dataIndex: "action",
      width: 220,
      align: "center",
      render: (_: unknown, record) => (
        <Space>
          <Button
            icon={<ApartmentOutlined />}
            onClick={() => {
              setDrawerCategory(record);
              setDrawerOpen(true);
            }}
          >
            Options
          </Button>

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
                await http.delete(`/admin/profile-categories/${record.id}`);
                optimisticRemove(record.id);
                message.success("Deleted");
                fetchList(params, pagination);
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
  ];

  return (
    <>
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
              placeholder="Search Profile Category"
              allowClear
              onSearch={(val) => {
                const next = { q: val };
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

      <Table
        style={{ marginTop: 10 }}
        rowKey={(r) => String(r.id)}
        dataSource={data}
        columns={columns}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      {}
      <Modal
        centered
        open={open}
        title={current ? "Edit Profile Category" : "Create Profile Category"}
        destroyOnClose
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
      >
        <FormProfileCategory
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList(params, pagination);
          }}
        />
      </Modal>

      {}
      <Modal
        open={drawerOpen}
        onCancel={() => {
          setDrawerOpen(false);
          setDrawerCategory(null);
        }}
        footer={null}
        width={900}
        title={
          <span>
            Profile Category Options — <strong>{drawerCategory?.name || "-"}</strong>
          </span>
        }
        destroyOnClose
      >
        {}
        {drawerCategory && (
          <TableProfileCategoryOption
            categoryId={drawerCategory.id}
            categoryName={drawerCategory.name}
          />
        )}
      </Modal>
    </>
  );
};

export default TableProfileCategory;
