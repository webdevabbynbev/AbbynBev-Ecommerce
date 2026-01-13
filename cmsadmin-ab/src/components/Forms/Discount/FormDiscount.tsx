import React, { useEffect, useMemo, useState } from "react";
import { Form, Input, Button, Select, Radio, Checkbox, Divider } from "antd";
import moment from "moment";
import http from "../../../api/http";
import helper from "../../../utils/helper";

type DiscountFormValues = {
  id?: number | string;

  name: string;
  code: string;
  description?: string;

  value_type: number; // 1 percentage, 2 nominal
  value: string;
  max_discount?: string;

  applies_to: number; // 0 all, 1 min_order, 2 collection, 3 variant
  min_order_amount?: string;

  // targets
  category_type_ids?: number[];
  variant_ids?: number[];

  // eligibility
  eligibility_type: number; // 0 all, 1 specific_customers
  customer_ids?: number[];

  // limits
  is_unlimited: 1 | 0;
  qty?: number; // total usage limit (if not unlimited)
  max_per_user?: number;

  // channels
  is_ecommerce: 1 | 0;
  is_pos: 1 | 0;

  // schedule
  started_at: string;
  no_expiry: 1 | 0;
  expired_at?: string;
  days_of_week?: string[]; // ["0","1"...] (0=Sunday)
  is_active: number; // 1/2
};

type Props = {
  data?: any;
  handleClose: () => void;
};

const dayOptions = [
  { label: "Minggu", value: "0" },
  { label: "Senin", value: "1" },
  { label: "Selasa", value: "2" },
  { label: "Rabu", value: "3" },
  { label: "Kamis", value: "4" },
  { label: "Jumat", value: "5" },
  { label: "Sabtu", value: "6" },
];

const FormDiscount: React.FC<Props> = ({ data, handleClose }) => {
  const [form] = Form.useForm<DiscountFormValues>();

  const [appliesTo, setAppliesTo] = useState<number>(data?.appliesTo ?? 0);
  const [valueType, setValueType] = useState<number>(data?.valueType ?? 1);
  const [noExpiry, setNoExpiry] = useState<number>(data?.expiredAt ? 0 : 1);

  // category types options
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: number }[]>([]);

  // variants remote options
  const [variantOptions, setVariantOptions] = useState<{ label: string; value: number }[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);

  // customers remote options
  const [customerOptions, setCustomerOptions] = useState<{ label: string; value: number }[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const init: DiscountFormValues = useMemo(() => {
    return {
      id: data?.id ?? "",
      name: data?.name ?? "",
      code: data?.code ?? "",
      description: data?.description ?? "",

      value_type: data?.valueType ?? 1,
      value: data?.value ? String(data.value) : "",
      max_discount: data?.maxDiscount ? helper.formatRupiah(data.maxDiscount) : "",

      applies_to: data?.appliesTo ?? 0,
      min_order_amount: data?.minOrderAmount ? helper.formatRupiah(data.minOrderAmount) : "",

      category_type_ids: data?.categoryTypeIds ?? [],
      variant_ids: data?.variantIds ?? [],

      eligibility_type: data?.eligibilityType ?? 0,
      customer_ids: data?.customerIds ?? [],

      is_unlimited: data?.qty ? 0 : 1,
      qty: data?.qty ?? undefined,
      max_per_user: data?.maxPerUser ?? undefined,

      is_ecommerce: data?.isEcommerce ? 1 : 0,
      is_pos: data?.isPos ? 1 : 0,

      started_at: data?.startedAt
        ? moment(data.startedAt).utc().format("YYYY-MM-DDTHH:mm")
        : moment().format("YYYY-MM-DDTHH:mm"),

      no_expiry: data?.expiredAt ? 0 : 1,
      expired_at: data?.expiredAt
        ? moment(data.expiredAt).utc().format("YYYY-MM-DDTHH:mm")
        : "",

      days_of_week: data?.daysOfWeek?.map(String) ?? ["0","1","2","3","4","5","6"],
      is_active: data?.isActive ?? 1,
    };
  }, [data]);

  useEffect(() => {
    form.setFieldsValue(init);
    setAppliesTo(init.applies_to);
    setValueType(init.value_type);
    setNoExpiry(init.no_expiry);
    fetchCategoryTypes();
  }, [data]);

  const fetchCategoryTypes = async () => {
    const resp: any = await http.get("/admin/category-types/list");
    const list = resp?.data?.serve ?? [];
    // flatten tree
    const flat: { label: string; value: number }[] = [];
    const walk = (nodes: any[], prefix = "") => {
      for (const n of nodes) {
        flat.push({ label: `${prefix}${n.name}`, value: Number(n.id) });
        if (Array.isArray(n.children) && n.children.length) walk(n.children, prefix + "— ");
      }
    };
    walk(list);
    setCategoryOptions(flat);
  };

  const searchVariants = async (keyword: string) => {
    if (!keyword || keyword.length < 2) return;
    setVariantLoading(true);
    try {
      const resp: any = await http.get(`/admin/product?name=${encodeURIComponent(keyword)}&page=1&per_page=10`);
      const products = resp?.data?.serve?.data ?? [];
      const opts: { label: string; value: number }[] = [];
      for (const p of products) {
        for (const v of p.variants ?? []) {
          const label = `${p.name} • ${v.sku ?? "SKU-?"} • (id:${v.id})`;
          opts.push({ label, value: Number(v.id) });
        }
      }
      setVariantOptions(opts);
    } finally {
      setVariantLoading(false);
    }
  };

  const searchCustomers = async (keyword: string) => {
    setCustomerLoading(true);
    try {
      const resp: any = await http.get(`/admin/customers?q=${encodeURIComponent(keyword)}&page=1&per_page=10`);
      const users = resp?.data?.serve?.data ?? [];
      setCustomerOptions(
        users.map((u: any) => ({
          value: Number(u.id),
          label: `${u.firstName ?? ""} ${u.lastName ?? ""} • ${u.email ?? ""}`.trim(),
        }))
      );
    } finally {
      setCustomerLoading(false);
    }
  };

  const onFinish = async (values: DiscountFormValues) => {
    // normalisasi angka rupiah
    const payload: any = { ...values };

    if (payload.value_type === 2) payload.value = String(payload.value).replace(/\./g, "");
    if (payload.max_discount) payload.max_discount = String(payload.max_discount).replace(/\./g, "");
    if (payload.min_order_amount) payload.min_order_amount = String(payload.min_order_amount).replace(/\./g, "");

    if (payload.is_unlimited === 1) payload.qty = null;

    if (payload.no_expiry === 1) payload.expired_at = null;

    if (values.id) {
      await http.put(`/admin/discounts/${values.id}`, payload);
    } else {
      await http.post(`/admin/discounts`, payload);
    }

    form.resetFields();
    handleClose();
  };

  return (
    <Form<DiscountFormValues>
      autoComplete="off"
      form={form}
      layout="vertical"
      initialValues={init}
      onFinish={onFinish}
    >
      <Form.Item label="ID" name="id" hidden><Input hidden /></Form.Item>

      <Form.Item label="Nama Diskon" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Kode Diskon" name="code" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Deskripsi" name="description">
        <Input.TextArea rows={2} />
      </Form.Item>

      <Divider>Nilai Diskon</Divider>

      <Form.Item label="Tipe" name="value_type">
        <Radio.Group
          buttonStyle="solid"
          onChange={(e) => setValueType(e.target.value)}
        >
          <Radio.Button value={1}>Persen (%)</Radio.Button>
          <Radio.Button value={2}>Nominal (Rp)</Radio.Button>
        </Radio.Group>
      </Form.Item>

      {valueType === 1 ? (
        <>
          <Form.Item label="Persen" name="value" rules={[{ required: true }]}>
            <Input type="number" suffix="%" />
          </Form.Item>

          <Form.Item label="Max Diskon (opsional)" name="max_discount">
            <Input
              prefix="Rp"
              onChange={(e) => {
                const v = e.target.value;
                form.setFieldValue("max_discount", v ? helper.formatRupiah(v) : "");
              }}
            />
          </Form.Item>
        </>
      ) : (
        <Form.Item label="Nominal" name="value" rules={[{ required: true }]}>
          <Input
            prefix="Rp"
            onChange={(e) => {
              const v = e.target.value;
              form.setFieldValue("value", v ? helper.formatRupiah(v) : "");
            }}
          />
        </Form.Item>
      )}

      <Divider>Kondisi</Divider>

      <Form.Item label="Untuk" name="applies_to">
        <Select
          onChange={(v) => setAppliesTo(v)}
          options={[
            { value: 0, label: "Semua Pesanan" },
            { value: 1, label: "Pesanan Minimal" },
            { value: 2, label: "Koleksi Produk (Category)" },
            { value: 3, label: "Varian Produk" },
          ]}
        />
      </Form.Item>

      {appliesTo === 1 ? (
        <Form.Item label="Minimum total belanja" name="min_order_amount" rules={[{ required: true }]}>
          <Input
            prefix="Rp"
            onChange={(e) => {
              const v = e.target.value;
              form.setFieldValue("min_order_amount", v ? helper.formatRupiah(v) : "");
            }}
          />
        </Form.Item>
      ) : null}

      {appliesTo === 2 ? (
        <Form.Item label="Pilih Koleksi (Category Types)" name="category_type_ids" rules={[{ required: true }]}>
          <Select
            mode="multiple"
            placeholder="Pilih category..."
            options={categoryOptions}
          />
        </Form.Item>
      ) : null}

      {appliesTo === 3 ? (
        <Form.Item label="Pilih Varian Produk" name="variant_ids" rules={[{ required: true }]}>
          <Select
            mode="multiple"
            showSearch
            filterOption={false}
            onSearch={searchVariants}
            options={variantOptions}
            loading={variantLoading}
            placeholder="Ketik minimal 2 huruf untuk cari produk..."
          />
        </Form.Item>
      ) : null}

      <Divider>Pengaturan Pelanggan</Divider>

      <Form.Item label="Dapat dipakai oleh" name="eligibility_type">
        <Select
          options={[
            { value: 0, label: "Semua Orang" },
            { value: 1, label: "Pelanggan Tertentu" },
          ]}
        />
      </Form.Item>

      {form.getFieldValue("eligibility_type") === 1 ? (
        <Form.Item label="Pilih Pelanggan" name="customer_ids" rules={[{ required: true }]}>
          <Select
            mode="multiple"
            showSearch
            filterOption={false}
            onSearch={searchCustomers}
            options={customerOptions}
            loading={customerLoading}
            placeholder="Cari nama/email pelanggan..."
          />
        </Form.Item>
      ) : null}

      <Divider>Batas Pemakaian</Divider>

      <Form.Item label="Total kuantitas tersedia" name="is_unlimited">
        <Radio.Group buttonStyle="solid">
          <Radio.Button value={1}>Tidak terbatas</Radio.Button>
          <Radio.Button value={0}>Tentukan batas</Radio.Button>
        </Radio.Group>
      </Form.Item>

      {form.getFieldValue("is_unlimited") === 0 ? (
        <Form.Item label="Qty total" name="qty" rules={[{ required: true }]}>
          <Input type="number" />
        </Form.Item>
      ) : null}

      <Form.Item label="Batas per pelanggan (opsional)" name="max_per_user">
        <Input type="number" />
      </Form.Item>

      <Divider>Channel & Waktu</Divider>

      <Form.Item label="Tampilkan" name="is_ecommerce">
        <Checkbox
          checked={form.getFieldValue("is_ecommerce") === 1}
          onChange={(e) => form.setFieldValue("is_ecommerce", e.target.checked ? 1 : 0)}
        >
          Toko Online (Ecommerce)
        </Checkbox>
      </Form.Item>

      <Form.Item name="is_pos">
        <Checkbox
          checked={form.getFieldValue("is_pos") === 1}
          onChange={(e) => form.setFieldValue("is_pos", e.target.checked ? 1 : 0)}
        >
          POS
        </Checkbox>
      </Form.Item>

      <Form.Item label="Tanggal Mulai" name="started_at" rules={[{ required: true }]}>
        <Input type="datetime-local" />
      </Form.Item>

      <Form.Item name="no_expiry">
        <Checkbox
          checked={noExpiry === 1}
          onChange={(e) => {
            const v = e.target.checked ? 1 : 0;
            setNoExpiry(v);
            form.setFieldValue("no_expiry", v);
          }}
        >
          Tidak ada kadaluarsa
        </Checkbox>
      </Form.Item>

      {noExpiry === 0 ? (
        <Form.Item label="Tanggal Selesai" name="expired_at" rules={[{ required: true }]}>
          <Input type="datetime-local" />
        </Form.Item>
      ) : null}

      <Form.Item label="Berlaku pada hari" name="days_of_week">
        <Checkbox.Group options={dayOptions} />
      </Form.Item>

      <Form.Item label="Status" name="is_active">
        <Radio.Group buttonStyle="solid">
          <Radio.Button value={1}>Aktif</Radio.Button>
          <Radio.Button value={2}>Nonaktif</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" shape="round" block>
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormDiscount;
