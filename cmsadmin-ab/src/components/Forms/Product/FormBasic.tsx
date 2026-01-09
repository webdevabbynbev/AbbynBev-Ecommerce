import React from "react";
import { Form, Input, Row, Button, Col, Image, message, Select } from "antd";
import type { FormInstance } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import http from "../../../api/http";
import helper from "../../../utils/helper";

type MediaItem = {
  url: string;
  type: 1 | 2;
};

type FormBasicProps = {
  medias: MediaItem[];
  setMedias: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  form: FormInstance<any>;
};

type CategoryNode = {
  id: number;
  name: string;
  children?: CategoryNode[];
};

type FlatCategory = { id: number; pathLabel: string };

const FormBasic: React.FC<FormBasicProps> = ({ medias, setMedias, form }) => {
  const [categories, setCategories] = React.useState<FlatCategory[]>([]);
  const [catLoading, setCatLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchCategoryTypes = async () => {
      try {
        setCatLoading(true);
        const res = await http.get("/admin/category-types/list");
        const serve: CategoryNode[] = Array.isArray(res?.data?.serve)
          ? res.data.serve
          : [];

        const out: FlatCategory[] = [];
        const walk = (node: CategoryNode, prefix: string[] = []) => {
          const path = [...prefix, node.name];
          out.push({ id: node.id, pathLabel: path.join(" / ") });
          if (Array.isArray(node.children)) {
            node.children.forEach((c) => walk(c, path));
          }
        };
        serve.forEach((n) => walk(n));
        setCategories(out);
      } catch (e) {
        console.error("Failed to load category types", e);
        setCategories([]);
      } finally {
        setCatLoading(false);
      }
    };

    fetchCategoryTypes();
  }, []);

  const handleUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/mp4,video/x-m4v,video/*";
    input.multiple = true;

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;

      const files = Array.from(target.files);

      try {
        const uploadPromises = files.map(async (file) => {
          const typeFile: 1 | 2 = file.type.startsWith("video/") ? 2 : 1;
          const fd = new FormData();
          fd.append("file", file);

          const res = await http.post("/upload", fd, {
            headers: { "content-type": "multipart/form-data" },
          });

          const signedUrl: string = res?.data?.signedUrl;
          return { url: signedUrl, type: typeFile } as MediaItem;
        });

        const uploadedMedias = await Promise.all(uploadPromises);

        setMedias((prev) => {
          const remaining = Math.max(0, 10 - prev.length);
          return remaining > 0
            ? [...prev, ...uploadedMedias.slice(0, remaining)]
            : prev;
        });
      } catch (err) {
        console.error(err);
        message.error("Upload failed");
      }
    };

    input.click();
  };

  const setBasePrice = (val: string) => {
    const formatted = val ? helper.formatRupiah(val) : "";
    if (typeof (form as any).setFieldValue === "function") {
      (form as any).setFieldValue("base_price", formatted);
    } else {
      form.setFieldsValue({ base_price: formatted });
    }
  };

  return (
    <>
      {}
      <Form.Item
        label="Title"
        name="name"
        rules={[{ required: true, message: "Title required." }]}
      >
        <Input />
      </Form.Item>

      {}
      <Form.Item
        label="Master SKU"
        name="master_sku"
        tooltip="Optional. Jika kosong, backend akan membangkitkan default berdasarkan ID produk."
      >
        <Input placeholder="e.g. PRD-001" />
      </Form.Item>

      {}
      <Form.Item
        label="Category Type"
        name="category_type_id"
        rules={[{ required: true, message: "Category type is required." }]}
      >
        <Select
          placeholder="Please select Category Type"
          loading={catLoading}
          showSearch
          optionFilterProp="children"
          allowClear
        >
          {categories.map((c) => (
            <Select.Option key={c.id} value={c.id}>
              {c.pathLabel}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {}
      <Form.Item label="Description" name="description">
        <Input.TextArea rows={4} placeholder="Product description (optional)" />
      </Form.Item>

      {}
      <Form.Item label="Media (10 file max)">
        <Row gutter={[12, 12]} align="middle">
          {medias.length > 0 &&
            medias.map((item, key) => (
              <Col
                xs={12}
                sm={12}
                md={12}
                lg={4}
                key={`${item.url}-${key}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.type === 1 ? (
                  <Image
                    src={item.url}
                    width="100%"
                    height={100}
                    style={{ objectFit: "contain" }}
                    alt="media"
                  />
                ) : (
                  <video
                    controls
                    src={item.url}
                    style={{ width: "100%", height: 100 }}
                  />
                )}
                <Button
                  icon={<DeleteOutlined />}
                  style={{ marginTop: 10 }}
                  type="text"
                  danger
                  onClick={() =>
                    setMedias((prev) => prev.filter((_, idx) => idx !== key))
                  }
                />
              </Col>
            ))}

          {medias.length < 10 && (
            <Col xs={12} sm={12} md={12} lg={4}>
              <div
                className="hover-file"
                style={{
                  border: "1px dashed var(--ant-primary-color)",
                  padding: 10,
                  borderRadius: 8,
                  width: "max-content",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 10,
                }}
                onClick={handleUploadClick}
              >
                <UploadOutlined style={{ fontSize: 30 }} />
                <div style={{ fontSize: 12 }}>Upload Media</div>
              </div>
            </Col>
          )}
        </Row>
      </Form.Item>

      {}
      <Form.Item
        label="Base Price"
        name="base_price"
        rules={[{ required: true, message: "Base price required." }]}
      >
        <Input
          prefix="Rp"
          onChange={(e) => setBasePrice(e.target.value)}
          inputMode="numeric"
          placeholder="0"
        />
      </Form.Item>

      {}
      <Form.Item
        label="Weight"
        name="weight"
        rules={[
          { required: true, message: "Weight required." },
          {
            validator: (_,_value) => {
              const value = Number(_value);
              return value < 0
                ? Promise.reject("Weight cannot be negative.")
                : Promise.resolve();
            },
          },
        ]}
      >
        <Input
          type="number"
          suffix="g"
          inputMode="numeric"
          placeholder="0"
          min={0}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val < 0) {
              form.setFieldsValue({ weight: 0 });
            }
          }}
        />
      </Form.Item>
    </>
  );
};

export default FormBasic;
