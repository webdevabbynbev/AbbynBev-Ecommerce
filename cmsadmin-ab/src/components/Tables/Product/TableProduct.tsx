import React from "react";
import { Table, Button, Card, Popconfirm, Image, Tag, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  PictureOutlined,
  UploadOutlined, // ✅ CSV
} from "@ant-design/icons";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import placeholder from "../../../assets/img/placeholder.png";
import http from "../../../api/http";
import history from "../../../utils/history";
import { useNavigate } from "react-router-dom";
import ProductCsvUpload from "../../product/ProductCsvUpload";

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

const buildColumns = (props: {
  fetch: () => void;
  navigate: ReturnType<typeof useNavigate>;
}): ColumnsType<ProductRecord> => [
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
        <Image
          src={placeholder}
          width={70}
          height={50}
          style={{ objectFit: "contain" }}
          preview={false}
        />
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
      (r.variants || []).reduce(
        (acc, cur) => acc + (Number(cur?.stock ?? 0) || 0),
        0
      ),
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
        return <Tag color="#87d068">War Product</Tag>;
      }
      return <Tag color="#2cb6f4">Normal Product</Tag>;
    },
  },
  {
    title: "Tag",
    render: (_: unknown, r) =>
      r.tags && r.tags.length ? r.tags.map((t) => t.name).join(", ") : "-",
    responsive: ["lg"],
  },
  {
    title: "#",
    width: 220,
    align: "center",
    render: (_: unknown, record) => (
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => props.navigate(`/product-form?id=${record.id}`)}
        >
          Edit
        </Button>

        <Button
          icon={<PictureOutlined />}
          onClick={() => props.navigate("/products-media")}
        >
          Media
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
  const [params] = React.useState<QueryParams>({ name: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = React.useState(false);

  // ✅ CSV STATE
  const [openCsvUpload, setOpenCsvUpload] = React.useState(false);

  React.useEffect(() => {
    fetch(params, pagination);
  }, []);

  const fetch = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("name", q.name);
      query.set("page", String(page?.current ?? pagination.current));
      query.set("per_page", String(page?.pageSize ?? pagination.pageSize));

      if (q.statusFilter === "draft") query.set("status", "draft");
      else if (q.statusFilter === "normal") {
        query.set("status", "normal");
        query.set("isFlashsale", "0");
      } else if (q.statusFilter === "war") {
        query.set("isFlashsale", "1");
      }

      const resp = (await http.get(
        `/admin/product?${query.toString()}`
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
      {/* FILTER */}
      <Card style={{ marginTop: 10 }}>{/* ... TIDAK DIUBAH */}</Card>

      {/* ACTION BAR */}
      <Card style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setOpenCsvUpload(true)}
            style={{ marginRight: 10 }}
          >
            Upload CSV
          </Button>

          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => navigate("/product-form")}
          >
            Create new
          </Button>
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
        onChange={(newPagination) => fetch(params, newPagination)}
        expandable={{
          expandedRowRender: (record) => (
            <Table<VariantRecord>
              rowKey={(r) => String(r.id)}
              dataSource={record.variants ?? []}
              pagination={false}
              size="small"
            >
              <Table.Column title="SKU" dataIndex="sku" />
              <Table.Column title="Stock" dataIndex="stock" />
              <Table.Column
                title="Price"
                dataIndex="price"
                render={(val: number) =>
                  `Rp. ${new Intl.NumberFormat("id-ID").format(val || 0)}`
                }
              />
            </Table>
          ),
          rowExpandable: (record) =>
            Array.isArray(record.variants) && record.variants.length > 0,
        }}
      />

      {/* ✅ CSV MODAL */}
      <ProductCsvUpload
        open={openCsvUpload}
        onOpenChange={setOpenCsvUpload}
        onSuccess={() => fetch(params, pagination)}
      />
    </DndProvider>
  );
};

export default TableProduct;
