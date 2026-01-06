import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Popconfirm,
  Select,
  Image,
  Tag,
  Row,
  Col,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import placeholder from "../../../assets/img/placeholder.png";
import http from "../../../api/http";
import history from "../../../utils/history";
import { useNavigate } from "react-router-dom";

type MediaItem = {
  url: string;
  type: 1 | 2;
  altText?: string;
};

type VariantRecord = {
  id: number | string;
  barcode?: string;
  stock: number;
  price: number;
};

type TagRecord = { id: number | string; name: string };

type ProductRecord = {
  id: number | string;
  position?: number | null;
  name: string;
  masterSku?: string | null;
  medias?: MediaItem[];
  variants?: VariantRecord[];
  categoryType?: { id: number | string; name: string } | null;
  tags?: TagRecord[];
  status?: string; 
  isFlashsale?: boolean; 
};

type StatusFilter = "normal" | "war" | "draft";

type QueryParams = {
  name: string;
  statusFilter?: StatusFilter;
};

type ListResponse = {
  data?: {
    serve: {
      data: ProductRecord[];
      currentPage: string | number;
      perPage: string | number;
      total: string | number;
    };
  };
};

const ItemType = { ROW: "row" } as const;

type DragItem = { index: number };

type DraggableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  index: number;
  moveRow: (fromIndex: number, toIndex: number) => void;
  data: ProductRecord[];
  fetchData: () => void;
};

const DraggableRow: React.FC<DraggableRowProps> = ({
  index,
  moveRow,
  className,
  style,
  data,
  fetchData,
  ...restProps
}) => {
  const ref = React.useRef<HTMLTableRowElement>(null);

  const [, drop] = useDrop<DragItem>({
    accept: ItemType.ROW,
    hover(item) {
      if (item.index !== index) {
        moveRow(item.index, index);
        item.index = index;
      }
    },
    async drop() {
      try {
        const updates = data.map((item, idx) => ({ id: item.id, order: idx }));
        await http.post("/admin/product/update-order", { updates });
        fetchData();
      } catch (e: any) {
        message.error(e?.response?.data?.message || "Failed to update order");
      }
    },
  });

  const [, drag] = useDrag({
    type: ItemType.ROW,
    item: { index },
  });

  drag(drop(ref));

  return (
    <tr
      ref={ref}
      className={className}
      style={{ cursor: "move", ...(style as React.CSSProperties) }}
      {...restProps}
    />
  );
};

const buildColumns = (props: { fetch: () => void; navigate: ReturnType<typeof useNavigate> }): ColumnsType<ProductRecord> => [
  {
    title: "Index",
    dataIndex: "position",
    width: 80,
    align: "center",
    render: (val?: number | null) => (typeof val === "number" ? val : "-"),
  },
  {
    title: "Image",
    align: "center",
    width: 110,
    render: (_: unknown, record) => {
      const img = (record.medias || []).find((m) => m.type === 1);
      return img ? (
        <Image
          alt={img.altText || record.name}
          src={img.url}
          width={70}
          height={50}
          style={{ objectFit: "contain" }}
          preview={false}
        />
      ) : (
        <Image src={placeholder} width={70} height={50} style={{ objectFit: "contain" }} preview={false} />
      );
    },
  },
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Master SKU",
    dataIndex: "masterSku",
    width: 160,
    render: (v?: string | null) => v || "-",
    responsive: ["md"],
  },
  {
    title: "Category Type",
    width: 220,
    render: (_: unknown, r) => r.categoryType?.name ?? "-",
    responsive: ["lg"],
  },
  {
    title: "Stock",
    width: 120,
    align: "center",
    render: (_: unknown, r) =>
      (r.variants || []).reduce((acc, cur) => acc + (Number(cur?.stock ?? 0) || 0), 0),
    responsive: ["md"],
  },
  {
    title: "Status",
    width: 160,
    align: "center",
    render: (_: unknown, r) => {
      if ((r.status || "").toLowerCase() === "draft") {
        return <Tag>Draft</Tag>;
      }
      if (r.isFlashsale) {
        return (
          <Tag color="#87d068" style={{ marginRight: 0, marginBottom: 10 }}>
            War Product
          </Tag>
        );
      }
      return (
        <Tag color="#2cb6f4" style={{ marginRight: 0, marginBottom: 10 }}>
          Normal Product
        </Tag>
      );
    },
  },
  {
    title: "Tag",
    render: (_: unknown, r) => (r.tags && r.tags.length ? r.tags.map((t) => t.name).join(", ") : "-"),
    responsive: ["lg"],
  },
  {
    title: "#",
    width: 220,
    align: "center",
    render: (_: unknown, record) => (
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => props.navigate(`/product-form?id=${record.id}`)}
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
              await http.delete(`/admin/product/${record.id}`);
              props.fetch();
            } catch (e: any) {
              message.error(e?.response?.data?.message || "Delete failed");
            }
          }}
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>

        <Button
          icon={<CopyOutlined />}
          onClick={() => history.push(`/product-duplicate?id=${record.id}`)}
        >
          Duplicate
        </Button>
      </div>
    ),
  },
];

const TableProduct: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = React.useState<ProductRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ name: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(params, pagination);
  }, []);

  const fetch = async (q: QueryParams = params, page?: TablePaginationConfig) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("name", q.name);
      query.set("page", String(page?.current ?? pagination.current));
      query.set("per_page", String(page?.pageSize ?? pagination.pageSize));

      if (q.statusFilter === "draft") {
        query.set("status", "draft");
      } else if (q.statusFilter === "normal") {
        query.set("status", "normal");
        query.set("isFlashsale", "0");
      } else if (q.statusFilter === "war") {
        query.set("isFlashsale", "1");
      }

      const resp = (await http.get(`/admin/product?${query.toString()}`)) as ListResponse;

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

  const handleTableChange = (page: TablePaginationConfig) => {
    fetch(params, page);
  };

  const moveRow = (fromIndex: number, toIndex: number) => {
    setData((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const columns = React.useMemo(
    () => buildColumns({ fetch: () => fetch(params, pagination), navigate }),
    [params, pagination, navigate]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Card style={{ marginTop: 10 }}>
        <Row gutter={[12, 12]} style={{ width: "100%" }} justify="center" align="middle">
          <Col xs={24} md={11}>
            <Select<StatusFilter>
              placeholder="Search by status"
              style={{ width: "100%" }}
              value={params.statusFilter}
              onChange={(val) => setParams((p) => ({ ...p, statusFilter: val ?? undefined }))}
              options={[
                { value: "normal", label: "Normal Product" },
                { value: "war", label: "War Product" },
                { value: "draft", label: "Draft" },
              ]}
              allowClear
            />
          </Col>
          <Col xs={24} md={11}>
            <Input
              value={params.name}
              placeholder="Search by name"
              onChange={(e) => setParams((p) => ({ ...p, name: e.target.value }))}
            />
          </Col>
          <Col xs={24} md={2}>
            <Button
              icon={<SearchOutlined />}
              type="primary"
              onClick={() => fetch(params, { ...pagination, current: 1 })}
              style={{ width: "100%" }}
            >
              Search
            </Button>
          </Col>
          <Col xs={24} md={2}>
            <Button
              type="link"
              onClick={() => {
                const next = { name: "", isFlashsale: 0 };
                setParams(next);
                fetch(next, { ...pagination, current: 1 });
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 10 }}>
        <div className="flex flex-wrap" style={{ width: "100%", alignItems: "flex-end" }}>
          <div className="flex align-center">
            <span style={{ fontSize: 12 }}>Show</span>
            <Select<number>
              onChange={(pageSize) => {
                const next = {
                  current: pagination.current ?? 1,
                  pageSize,
                  total: pagination.total ?? 0,
                };
                setPagination(next);
                fetch(params, next);
              }}
              style={{ width: 80, marginLeft: 10, marginRight: 10 }}
              value={(pagination.pageSize as number) ?? 10}
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
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => navigate("/product-form")}
              style={{ marginRight: 10 }}
            >
              Create new
            </Button>
          </div>
        </div>
      </Card>

      <Table<ProductRecord>
        components={{
          body: {
            row: (rowProps: any) => (
              <DraggableRow
                {...rowProps}
                data={data}
                fetchData={() => fetch(params, pagination)}
              />
            ),
          },
        }}
        onRow={(_record, index) => ({ index: index as number, moveRow } as any)}
        style={{ marginTop: 10 }}
        columns={columns}
        rowKey={(record) => String(record.id)}
        dataSource={data}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        expandable={{
          expandedRowRender: (record) => (
            <Table<VariantRecord>
              rowKey={(r) => String(r.id)}
              dataSource={record.variants ?? []}
              pagination={false}
              size="small"
            >
              <Table.Column<VariantRecord> title="SKU" dataIndex="sku" key="sku" />
              <Table.Column<VariantRecord> title="Stock" dataIndex="stock" key="stock" />
              <Table.Column<VariantRecord>
                title="Price"
                dataIndex="price"
                key="price"
                render={(val: number) => `Rp. ${new Intl.NumberFormat("id-ID").format(val || 0)}`}
              />
            </Table>
          ),
          rowExpandable: (record) => Array.isArray(record.variants) && record.variants.length > 0,
        }}
      />
    </DndProvider>
  );
};

export default TableProduct;
