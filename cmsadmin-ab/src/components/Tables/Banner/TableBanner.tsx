import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Popconfirm,
  Select,
  Modal,
  Space,
} from "antd";
import type {
  ColumnsType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import FormBanner from "../../Forms/Banner/FormBanner";
import http from "../../../api/http";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { getImageUrl } from "../../../utils/asset";

type BannerRecord = {
  id: number | string;
  order?: number;
  image?: string | null; 
  image_url?: string | null;
  imageMobile?: string | null; 
  image_mobile_url?: string | null;
  title?: string | null;
  description?: string | null;
  button_text?: string | null;
  button_url?: string | null;
};

type QueryParams = {
  name?: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: BannerRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  fetch: () => void;
  setOpen: (open: boolean) => void;
  setCurrent: (rec: BannerRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<BannerRecord> => [
  {
    title: "Order",
    dataIndex: "order",
    align: "center",
  },
  {
    title: "Image",
    render: (_: unknown, row) => {
      const src = getImageUrl(row.image_url || row.image || "");
      if (!src) return "No Image";

      const ext = src.split("?")[0].split(".").pop()?.toLowerCase();
      if (ext === "mp4") {
        return <video width={150} src={src} controls />;
      }
      return <img src={src} alt="banner" style={{ width: 50, objectFit: "contain" }} />;
    },
  },
  {
    title: "Image Mobile",
    render: (_: unknown, row) => {
      const src = getImageUrl(row.image_mobile_url || row.imageMobile || "");
      if (!src) return "No Image";

      const ext = src.split("?")[0].split(".").pop()?.toLowerCase();
      if (ext === "mp4") {
        return <video width={150} src={src} controls />;
      }
      return <img src={src} alt="banner-mobile" style={{ width: 75, objectFit: "contain" }} />;
    },
  },
  {
    title: "Title",
    dataIndex: "title",
  },
  {
    title: "Description",
    dataIndex: "description",
  },
  {
    title: "Button Text",
    dataIndex: "button_text",
  },
  {
    title: "Button URL",
    dataIndex: "button_url",
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
          gap: 10,
        }}
      >
        <Button
          type="primary"
          key="/edit"
          icon={<EditOutlined />}
          onClick={() => {
            props.setCurrent(record);
            props.setOpen(true);
          }}
        >
          Edit
        </Button>

        <Popconfirm
          placement="left"
          title="Are your sure want delete this data?"
          onConfirm={async () => {
            await http({
              url: `/admin/banners/${record.id}`,
              method: "DELETE",
            });
            props.fetch();
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button type="primary" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      </div>
    ),
  },
];

const ItemType = {
  ROW: "row",
} as const;

type DraggableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  index: number;
  moveRow: (from: number, to: number) => void;
  data: BannerRecord[];
  fetchData: (q?: QueryParams, p?: TablePaginationConfig) => void;
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

  const [, drop] = useDrop<{
    type: string;
    index: number;
  }>({
    accept: ItemType.ROW,
    hover(item) {
      if (item.index !== index) {
        moveRow(item.index, index);
        item.index = index;
      }
    },
    drop() {
      const updatedOrder = data.map((item, idx) => ({
        id: item.id,
        order: idx,
      }));
      http
        .post("/admin/banners/update-order", { updates: updatedOrder })
        .then(() => {
          fetchData({ name: "" }, { current: 1, pageSize: 10 });
        });
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
      style={{ cursor: "move", ...style }}
      {...restProps}
    />
  );
};

const TableBanner: React.FC = () => {
  const [data, setData] = React.useState<BannerRecord[]>([]);
  const [params, setParams] = React.useState<QueryParams>({ name: "" });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<BannerRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { Search } = Input;

  React.useEffect(() => {
    fetchList(params, pagination);
  }, []);

  const handleTableChange: TableProps<BannerRecord>["onChange"] = (page) => {
    fetchList(params, page as TablePaginationConfig);
  };

  const fetchList = async (
    q: QueryParams = params,
    page?: TablePaginationConfig
  ) => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/banners?name=${q.name ?? ""}&page=${
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

  const moveRow = (fromIndex: number, toIndex: number) => {
    const newData = [...data];
    const [movedItem] = newData.splice(fromIndex, 1);
    newData.splice(toIndex, 0, movedItem);
    setData(newData);
  };

  const FormBannerAny = FormBanner as React.ComponentType<any>;
  return (
    <DndProvider backend={HTML5Backend}>
      <Card style={{ marginTop: 10 }}>
        <div
          className="flex flex-wrap"
          style={{ width: "100%", alignItems: "flex-end" }}
        >
          <div className="flex align-center">
            <span style={{ fontSize: 12 }}>Show</span>
            <Select<number>
              style={{ width: 80, marginLeft: 10, marginRight: 10 }}
              value={(pagination.pageSize as number) ?? 10}
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
              placeholder="Search Banner"
              onSearch={(val) => {
                const next: QueryParams = { name: val };
                setParams(next);
                fetchList(next, pagination);
              }}
            />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setOpen(true)}
            >
              Create New
            </Button>
          </Space>
        </div>
      </Card>

      <Table<BannerRecord>
        components={{
            body: {
            row: (props: any) => (
                <DraggableRow
                {...props}
                data={data}
                fetchData={fetchList}
                />
            ),
            },
        }}
        onRow={(_record, index) =>
            ({
            index: index as number,
            moveRow,
            } as unknown as React.HTMLAttributes<HTMLTableRowElement>)
        }
        style={{ marginTop: 10 }}
        columns={columns({
            fetch: () => fetchList(params, pagination),
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
        title="Manage Banner"
        onCancel={async () => {
          setOpen(false);
          setCurrent(false);
          fetchList(params, pagination);
        }}
        footer={null}
      >
        <FormBannerAny
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList(params, pagination);
          }}
          fetch={() => fetchList(params, pagination)}
        />
      </Modal>
    </DndProvider>
  );
};

export default TableBanner;
