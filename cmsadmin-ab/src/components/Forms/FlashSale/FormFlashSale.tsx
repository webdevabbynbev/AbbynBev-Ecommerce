import React from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  DatePicker,
  Switch,
  Card,
  Space,
  Select,
  Divider,
  message,
} from "antd";
import type { RuleObject } from "antd/es/form";
import dayjs, { Dayjs } from "dayjs";
import http from "../../../api/http";

type FlashSaleProductInput = {
  product_id: number;
  flash_price: number;
  stock: number;
};

export type FlashSaleRecord = {
  id: number;
  title?: string | null;
  description?: string | null;
  hasButton?: boolean | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  startDatetime: string;
  endDatetime: string;
  isPublish?: boolean | null;
  products?: Array<{
    id: number;
    name: string;
    pivot?: { flash_price: number; stock: number };
  }>;
};

type Props = {
  data?: FlashSaleRecord | null;
  handleClose: () => void;
};

type FormValues = {
  title?: string;
  description?: string;
  has_button?: boolean;
  button_text?: string | null;
  button_url?: string | null;
  start_datetime: Dayjs;
  end_datetime: Dayjs;
  is_publish?: boolean;
  products: FlashSaleProductInput[];
};

const DATE_FMT = "YYYY-MM-DD HH:mm:ss";
const BASE_URL = "/admin/flashsales";
const PRODUCT_PAGE_SIZE = 200;

const getProductList = (payload: any): any[] => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const FormFlashSale: React.FC<Props> = ({ data, handleClose }) => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = React.useState(false);
  const hasButton = Form.useWatch("has_button", form);
  const [productOptions, setProductOptions] = React.useState<
    Array<{ value: number; label: string }>
  >([]);

  const loadProducts = React.useCallback(async (q?: string) => {
    try {
      const keyword = q ?? "";
      let page = 1;
      let lastPage: number | null = null;
      const collected: Array<{ value: number; label: string }> = [];
      const isSearching = Boolean(keyword.trim());

      while (page <= (lastPage ?? 1)) {
        const resp = await http.get(
          `/admin/products?q=${encodeURIComponent(keyword)}&page=${page}&per_page=${PRODUCT_PAGE_SIZE}`
        );
        const serve = resp?.data?.serve;
        const list = getProductList(serve);
        collected.push(...list.map((p: any) => ({ value: p.id, label: p.name })));

        if (typeof serve?.last_page === "number") {
          lastPage = serve.last_page;
        } else if (isSearching) {
          break;
        } else {
          break;
        }

        if (page >= (lastPage ?? 1)) break;
        page += 1;
      }

      const deduped = Array.from(
        new Map(collected.map((item) => [item.value, item])).values()
      );
      setProductOptions(deduped);
    } catch {
      message.error("Failed to load products");
    }
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  React.useEffect(() => {
    if (!data) {
      form.setFieldsValue({
        title: "",
        description: "",
        has_button: false,
        button_text: null,
        button_url: null,
        start_datetime: dayjs(),
        end_datetime: dayjs().add(1, "day"),
        is_publish: false,
        products: [],
      });
      return;
    }
    form.setFieldsValue({
      title: data.title ?? "",
      description: data.description ?? "",
      has_button: Boolean(data.hasButton),
      button_text: data.buttonText ?? null,
      button_url: data.buttonUrl ?? null,
      start_datetime: dayjs(data.startDatetime),
      end_datetime: dayjs(data.endDatetime),
      is_publish: Boolean(data.isPublish),
      products:
        data.products?.map((p) => ({
          product_id: p.id,
          flash_price: p.pivot?.flash_price ?? 1,
          stock: p.pivot?.stock ?? 0,
        })) ?? [],
    });
  }, [data, form]);

  React.useEffect(() => {
    if (hasButton === false) {
      form.setFieldsValue({ button_text: null, button_url: null });
      form.validateFields(["button_text", "button_url"]);
    }
  }, [hasButton, form]);
  const validateEndAfterStart = (_: RuleObject, value?: Dayjs) => {
    const start = form.getFieldValue("start_datetime");
    if (!value || !start) return Promise.resolve();
    return value.isAfter(start)
      ? Promise.resolve()
      : Promise.reject(new Error("End Date must be after Start Date"));
  };

  const onFinish = async (values: FormValues) => {
    try {
      setLoading(true);

      const payload = {
        title: values.title || null,
        description: values.description || null,
        has_button: !!values.has_button,
        button_text: values.has_button ? values.button_text || null : null,
        button_url: values.has_button ? values.button_url || null : null,
        start_datetime: values.start_datetime.format(DATE_FMT),
        end_datetime: values.end_datetime.format(DATE_FMT),
        is_publish: !!values.is_publish,
        products: (values.products ?? []).map((p) => ({
          product_id: p.product_id,
          flash_price: Number(p.flash_price),
          stock: Number(p.stock),
        })),
      };

      if (data?.id) {
        await http.put(`${BASE_URL}/${data.id}`, payload);
        message.success("Flash Sale updated");
      } else {
        await http.post(BASE_URL, payload, { headers: { "Content-Type": "application/json" } });
        message.success("Flash Sale created");
      }

      form.resetFields();
      handleClose();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} disabled={loading}>
      <Form.Item
        label="Title"
        name="title"
        rules={[{ required: true, message: "Title is required" }]}
      >
        <Input placeholder="Flash sale title" />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <Input.TextArea rows={4} placeholder="Description (optional)" />
      </Form.Item>

      <Space size="middle" style={{ display: "flex" }}>
        <Form.Item label="Has Button" name="has_button" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="Publish" name="is_publish" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Space>

      {}
      {hasButton ? (
        <Space size="middle" style={{ display: "flex" }}>
          <Form.Item
            label="Button Text"
            name="button_text"
            rules={[{ required: true, message: "Button Text is required" }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="e.g. Shop Now" />
          </Form.Item>
          <Form.Item
            label="Button URL"
            name="button_url"
            rules={[
              { required: true, message: "Button URL is required" },
              { type: "url", message: "Please enter a valid URL" },
            ]}
            style={{ flex: 1 }}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>
        </Space>
      ) : null}

      <Space size="middle" style={{ display: "flex" }}>
        <Form.Item
          label="Start Date"
          name="start_datetime"
          rules={[{ required: true, message: "Start date is required" }]}
          style={{ flex: 1 }}
        >
          <DatePicker showTime style={{ width: "100%" }} format={DATE_FMT} />
        </Form.Item>

        <Form.Item
          label="End Date"
          name="end_datetime"
          rules={[
            { required: true, message: "End date is required" },
            { validator: validateEndAfterStart },
          ]}
          style={{ flex: 1 }}
        >
          <DatePicker showTime style={{ width: "100%" }} format={DATE_FMT} />
        </Form.Item>
      </Space>

      <Divider orientation="left">Products</Divider>

      <Form.List
        name="products"
        rules={[
          {
            validator: async (_, list) => {
              if (!list || list.length < 1) {
                return Promise.reject(new Error("At least 1 product is required"));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <Card size="small" bordered>
            {fields.map((field) => (
              <Card key={field.key} size="small" style={{ marginBottom: 8 }}>
                <Space align="start" style={{ display: "flex" }} wrap>
                  <Form.Item
                    {...field}
                    label="Product"
                    name={[field.name, "product_id"]}
                    rules={[{ required: true, message: "Product is required" }]}
                    style={{ minWidth: 260 }}
                  >
                    <Select
                      showSearch
                      placeholder="Select product"
                      options={productOptions}
                      optionFilterProp="label"
                      onSearch={(v) => loadProducts(v)}
                    />
                  </Form.Item>

                  <Form.Item
                    {...field}
                    label="Flash Price"
                    name={[field.name, "flash_price"]}
                    rules={[{ required: true, message: "Flash price is required" }]}
                  >
                    <InputNumber
                      min={1}
                      precision={0}
                      style={{ width: 180 }}
                      formatter={(v) => {
                        if (v === undefined || v === null) return "";
                        const s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        return `Rp ${s}`;
                      }}
                      parser={(v: string | undefined) => {
                        const cleaned = (v ?? "").toString().replace(/[^0-9]/g, "");
                        const n = Number(cleaned);
                        return Number.isNaN(n) ? 0 : n;
                      }}
                      onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData("text");
                      if (!/^\d+$/.test(text)) {
                        e.preventDefault();
                      }
                    }}
                    />
                  </Form.Item>

                  <Form.Item
                    {...field}
                    label="Stock"
                    name={[field.name, "stock"]}
                    rules={[{ required: true, message: "Stock is required" }]}
                  >
                    <InputNumber min={0} style={{ width: 120 }} />
                  </Form.Item>

                  <Button danger onClick={() => remove(field.name)}>
                    Remove
                  </Button>
                </Space>
              </Card>
            ))}

            <Form.ErrorList errors={errors} />

            <Button type="dashed" onClick={() => add()} block>
              Add Product
            </Button>
          </Card>
        )}
      </Form.List>

      <Form.Item style={{ marginTop: 16 }}>
        <Button type="primary" htmlType="submit" block shape="round" loading={loading}>
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormFlashSale;
