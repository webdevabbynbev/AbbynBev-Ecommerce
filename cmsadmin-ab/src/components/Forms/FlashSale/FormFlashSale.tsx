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

  product_ids: number[];
  products: FlashSaleProductInput[];
};

const DATE_FMT = "YYYY-MM-DD HH:mm:ss";
const BASE_URL = "/admin/flashsales";

const PRODUCT_ENDPOINT = "/admin/product";
const PRODUCT_PAGE_SIZE = 200;

const getProductList = (serve: any): any[] => {
  if (Array.isArray(serve?.data)) return serve.data;
  if (Array.isArray(serve)) return serve;
  return [];
};

const dedupeOptions = (arr: Array<{ value: number; label: string }>) =>
  Array.from(new Map(arr.map((x) => [Number(x.value), x])).values());

const FormFlashSale: React.FC<Props> = ({ data, handleClose }) => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = React.useState(false);
  const hasButton = Form.useWatch("has_button", form);

  const [productOptions, setProductOptions] = React.useState<
    Array<{ value: number; label: string }>
  >([]);

  // keep latest options in ref (biar loadProducts gak pakai state yang basi)
  const productOptionsRef = React.useRef(productOptions);
  React.useEffect(() => {
    productOptionsRef.current = productOptions;
  }, [productOptions]);

  // debouncer
  const searchTimerRef = React.useRef<any>(null);

  // label map (buat row detail)
  const optionMap = React.useMemo(() => {
    const m = new Map<number, string>();
    for (const o of productOptions) m.set(Number(o.value), o.label);
    return m;
  }, [productOptions]);

  const getLabel = (id: any) => optionMap.get(Number(id)) || `Product #${id}`;

  /**
   * ✅ FIX SEARCH:
   * - kalau keyword ada: options = (selected options) + (search results)
   * - kalau keyword kosong: options = (selected options) + (default list page 1)
   */
  const loadProducts = React.useCallback(
    async (q?: string) => {
      try {
        const keyword = (q ?? "").trim();

        const qs = new URLSearchParams();
        if (keyword) qs.set("name", keyword); // ✅ backend pakai name
        qs.set("page", "1");
        qs.set("per_page", String(PRODUCT_PAGE_SIZE));

        const resp = await http.get(`${PRODUCT_ENDPOINT}?${qs.toString()}`);
        const serve = resp?.data?.serve;

        const list = getProductList(serve);
        const results = list.map((p: any) => ({ value: Number(p.id), label: String(p.name) }));

        // keep selected options (biar yang udah dipilih tetap muncul walau search berubah)
        const selectedIds = (form.getFieldValue("product_ids") || []) as number[];
        const currentOptions = productOptionsRef.current;

        const selectedOptions = selectedIds.map((id) => {
          const found =
            currentOptions.find((o) => Number(o.value) === Number(id)) ||
            results.find((o) => Number(o.value) === Number(id));
          return found || { value: Number(id), label: `Product #${id}` };
        });

        // ✅ ini kuncinya: SET (bukan merge all lama)
        setProductOptions(dedupeOptions([...selectedOptions, ...results]));
      } catch (e: any) {
        message.error(e?.response?.data?.message || e?.message || "Failed to load products");
      }
    },
    [form]
  );

  // handle search with debounce
  const onSearchProducts = React.useCallback(
    (v: string) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        loadProducts(v);
      }, 300);
    },
    [loadProducts]
  );

  // ✅ Sync multi select -> products detail list
  const syncSelectedProducts = React.useCallback(
    (idsRaw: any[]) => {
      const ids = Array.from(
        new Set(
          (idsRaw || [])
            .map((x) => Number(x))
            .filter((x) => Number.isFinite(x) && x > 0)
        )
      );

      const currentList = (form.getFieldValue("products") || []) as FlashSaleProductInput[];
      const map = new Map<number, FlashSaleProductInput>();
      for (const row of currentList) map.set(Number(row.product_id), row);

      const nextList: FlashSaleProductInput[] = ids.map((id) => {
        const existing = map.get(id);
        return (
          existing || {
            product_id: id,
            flash_price: 1,
            stock: 0,
          }
        );
      });

      form.setFieldsValue({
        product_ids: ids,
        products: nextList,
      });
    },
    [form]
  );

  React.useEffect(() => {
    loadProducts(""); // load default options
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
        product_ids: [],
        products: [],
      });
      return;
    }

    const initialProducts =
      data.products?.map((p) => ({
        product_id: p.id,
        flash_price: p.pivot?.flash_price ?? 1,
        stock: p.pivot?.stock ?? 0,
      })) ?? [];

    const fromDataOptions = data.products?.map((p) => ({ value: p.id, label: p.name })) ?? [];
    setProductOptions((prev) => dedupeOptions([...prev, ...fromDataOptions]));

    form.setFieldsValue({
      title: data.title ?? "",
      description: data.description ?? "",
      has_button: Boolean(data.hasButton),
      button_text: data.buttonText ?? null,
      button_url: data.buttonUrl ?? null,
      start_datetime: dayjs(data.startDatetime),
      end_datetime: dayjs(data.endDatetime),
      is_publish: Boolean(data.isPublish),
      product_ids: initialProducts.map((x) => x.product_id),
      products: initialProducts,
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
          product_id: Number(p.product_id),
          flash_price: Number(p.flash_price),
          stock: Number(p.stock),
        })),
      };

      if (data?.id) {
        await http.put(`${BASE_URL}/${data.id}`, payload);
        message.success("Flash Sale updated");
      } else {
        await http.post(BASE_URL, payload, {
          headers: { "Content-Type": "application/json" },
        });
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

      <Form.Item
        label="Select Products"
        name="product_ids"
        rules={[{ required: true, message: "Select at least 1 product" }]}
      >
        <Select
          mode="multiple"
          showSearch
          placeholder="Type to search product (e.g. khaf)"
          options={productOptions}
          filterOption={false} // server-side search
          onSearch={onSearchProducts}
          onDropdownVisibleChange={(open) => {
            if (open) loadProducts(""); // load default list setiap buka dropdown
          }}
          onChange={(ids) => syncSelectedProducts(ids as any[])}
        />
      </Form.Item>

      <Form.List name="products">
        {(fields) => (
          <Card size="small" bordered>
            {fields.length === 0 ? (
              <div style={{ padding: 12, color: "#888" }}>
                Choose products above to generate fields.
              </div>
            ) : null}

            {fields.map((field) => {
              const currentId = form.getFieldValue(["products", field.name, "product_id"]);
              return (
                <Card key={field.key} size="small" style={{ marginBottom: 8 }}>
                  <Space align="start" style={{ display: "flex" }} wrap>
                    <Form.Item name={[field.name, "product_id"]} hidden>
                      <Input />
                    </Form.Item>

                    <div style={{ minWidth: 260 }}>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                        Product
                      </div>
                      <div style={{ fontWeight: 600 }}>{getLabel(currentId)}</div>

                      <Button
                        danger
                        size="small"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                          const ids = (form.getFieldValue("product_ids") || []) as number[];
                          const nextIds = ids.filter((x) => Number(x) !== Number(currentId));
                          syncSelectedProducts(nextIds);
                        }}
                      >
                        Remove
                      </Button>
                    </div>

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
                          if (!/[0-9]/.test(e.key)) e.preventDefault();
                        }}
                        onPaste={(e) => {
                          const text = e.clipboardData.getData("text");
                          if (!/^\d+$/.test(text)) e.preventDefault();
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
                  </Space>
                </Card>
              );
            })}
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
