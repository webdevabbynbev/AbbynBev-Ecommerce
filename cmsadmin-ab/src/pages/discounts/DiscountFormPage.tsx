import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Select,
  Radio,
  Checkbox,
  Switch,
  Divider,
  message,
} from "antd";
import http from "../../api/http";
import helper from "../../utils/helper";

type Props = { mode: "create" | "edit" };

const dayOptions = [
  { label: "Minggu", value: "0" },
  { label: "Senin", value: "1" },
  { label: "Selasa", value: "2" },
  { label: "Rabu", value: "3" },
  { label: "Kamis", value: "4" },
  { label: "Jumat", value: "5" },
  { label: "Sabtu", value: "6" },
];

export default function DiscountFormPage({ mode }: Props) {
  const [form] = Form.useForm();
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  // state dari TableDiscount saat klik Edit
  const fromState = (location.state as any) || null;

  // options
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: number }[]>([]);
  const [variantOptions, setVariantOptions] = useState<{ label: string; value: number }[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ label: string; value: number }[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);

  const fetchCategoryTypes = async () => {
    const resp: any = await http.get("/admin/category-types/list");
    const list = resp?.data?.serve ?? [];
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
      const resp: any = await http.get(
        `/admin/product?name=${encodeURIComponent(keyword)}&page=1&per_page=10`
      );
      const products = resp?.data?.serve?.data ?? [];
      const opts: { label: string; value: number }[] = [];
      for (const p of products) {
        for (const v of p.variants ?? []) {
          opts.push({
            label: `${p.name} • ${v.sku ?? "-"} • (id:${v.id})`,
            value: Number(v.id),
          });
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
      const resp: any = await http.get(
        `/admin/customers?q=${encodeURIComponent(keyword)}&page=1&per_page=10`
      );
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

  const loadEdit = async () => {
    // kalau backend belum ada endpoint show, minimal pakai state dari list
    if (mode !== "edit") return;

    if (fromState) {
      const init = mapApiToForm(fromState);
      form.setFieldsValue(init);
      return;
    }

    // OPTIONAL kalau backend ada show:
    try {
      setLoading(true);
      const resp: any = await http.get(`/admin/discounts/${id}`);
      const data = resp?.data?.serve;
      if (data) form.setFieldsValue(mapApiToForm(data));
    } finally {
      setLoading(false);
    }
  };

  const mapApiToForm = (data: any) => {
    return {
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
      qty: data?.qty ?? null,
      max_per_user: data?.maxPerUser ?? null,

      is_ecommerce: data?.isEcommerce ? 1 : 0,
      is_pos: data?.isPos ? 1 : 0,
      is_active: data?.isActive ?? 1,

      started_at: data?.startedAt ?? null,
      no_expiry: data?.expiredAt ? 0 : 1,
      expired_at: data?.expiredAt ?? null,
      days_of_week: data?.daysOfWeek?.map(String) ?? ["0","1","2","3","4","5","6"],
    };
  };

  useEffect(() => {
    fetchCategoryTypes();
    // default create
    if (mode === "create") {
      form.setFieldsValue({
        value_type: 1,
        applies_to: 0,
        eligibility_type: 0,
        is_unlimited: 1,
        is_ecommerce: 1,
        is_pos: 1,
        is_active: 1,
        no_expiry: 1,
        days_of_week: ["0","1","2","3","4","5","6"],
      });
    }
    loadEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async () => {
    const values = await form.validateFields();
    const payload: any = { ...values };

    // normalisasi rupiah
    if (payload.value_type === 2) payload.value = String(payload.value).replace(/\./g, "");
    if (payload.max_discount) payload.max_discount = String(payload.max_discount).replace(/\./g, "");
    if (payload.min_order_amount) payload.min_order_amount = String(payload.min_order_amount).replace(/\./g, "");

    if (payload.is_unlimited === 1) payload.qty = null;
    if (payload.no_expiry === 1) payload.expired_at = null;

    setLoading(true);
    try {
      if (mode === "edit") {
        await http.put(`/admin/discounts/${id}`, payload);
        message.success("Diskon berhasil diupdate");
      } else {
        await http.post(`/admin/discounts`, payload);
        message.success("Diskon berhasil dibuat");
      }
      nav("/discounts");
    } finally {
      setLoading(false);
    }
  };

  // WATCHES biar UI dinamis
  const valueType = Form.useWatch("value_type", form) ?? 1;
  const appliesTo = Form.useWatch("applies_to", form) ?? 0;
  const eligibility = Form.useWatch("eligibility_type", form) ?? 0;
  const unlimited = Form.useWatch("is_unlimited", form) ?? 1;
  const noExpiry = Form.useWatch("no_expiry", form) ?? 1;

  const isActive = Form.useWatch("is_active", form) ?? 1;
  const isEcommerce = Form.useWatch("is_ecommerce", form) ?? 1;
  const isPos = Form.useWatch("is_pos", form) ?? 1;

  return (
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        {/* LEFT - Main form */}
        <Col xs={24} lg={16}>
          <Card
            title={mode === "edit" ? "Edit Diskon" : "Tambah Diskon"}
            extra={
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={() => nav("/discounts")}>Batal</Button>
                <Button type="primary" loading={loading} onClick={onSubmit}>
                  Simpan
                </Button>
              </div>
            }
          >
            <Form.Item label="Nama Diskon" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item label="Kode Diskon" name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item label="Deskripsi" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Divider />

            <Card size="small" title="Kondisi" style={{ marginBottom: 12 }}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Tipe" name="value_type" rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: 1, label: "Persen (%)" },
                        { value: 2, label: "Nominal (Rp)" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Nilai"
                    name="value"
                    rules={[{ required: true }]}
                  >
                    {valueType === 1 ? (
                      <Input type="number" suffix="%" />
                    ) : (
                      <Input
                        prefix="Rp"
                        onChange={(e) => form.setFieldValue("value", helper.formatRupiah(e.target.value))}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>

              {valueType === 1 ? (
                <Form.Item label="Max Diskon (opsional)" name="max_discount">
                  <Input
                    prefix="Rp"
                    onChange={(e) =>
                      form.setFieldValue("max_discount", helper.formatRupiah(e.target.value))
                    }
                  />
                </Form.Item>
              ) : null}

              <Form.Item label="Untuk" name="applies_to" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 0, label: "Semua Pesanan" },
                    { value: 1, label: "Pesanan Minimal" },
                    { value: 2, label: "Koleksi Produk (Category Types)" },
                    { value: 3, label: "Varian Produk" },
                  ]}
                />
              </Form.Item>

              {appliesTo === 1 ? (
                <Form.Item
                  label="Minimum total belanja"
                  name="min_order_amount"
                  rules={[{ required: true }]}
                >
                  <Input
                    prefix="Rp"
                    onChange={(e) =>
                      form.setFieldValue("min_order_amount", helper.formatRupiah(e.target.value))
                    }
                  />
                </Form.Item>
              ) : null}

              {appliesTo === 2 ? (
                <Form.Item
                  label="Pilih Koleksi (Category Types)"
                  name="category_type_ids"
                  rules={[{ required: true }]}
                >
                  <Select mode="multiple" options={categoryOptions} />
                </Form.Item>
              ) : null}

              {appliesTo === 3 ? (
                <Form.Item
                  label="Pilih Varian Produk"
                  name="variant_ids"
                  rules={[{ required: true }]}
                >
                  <Select
                    mode="multiple"
                    showSearch
                    filterOption={false}
                    onSearch={searchVariants}
                    options={variantOptions}
                    loading={variantLoading}
                    placeholder="Ketik minimal 2 huruf untuk cari..."
                  />
                </Form.Item>
              ) : null}
            </Card>

            <Card size="small" title="Pengaturan Pelanggan" style={{ marginBottom: 12 }}>
              <Form.Item label="Dapat dipakai oleh" name="eligibility_type">
                <Select
                  options={[
                    { value: 0, label: "Semua orang" },
                    { value: 1, label: "Pelanggan tertentu" },
                  ]}
                />
              </Form.Item>

              {eligibility === 1 ? (
                <Form.Item label="Pilih Pelanggan" name="customer_ids" rules={[{ required: true }]}>
                  <Select
                    mode="multiple"
                    showSearch
                    filterOption={false}
                    onSearch={searchCustomers}
                    options={customerOptions}
                    loading={customerLoading}
                    placeholder="Cari nama/email..."
                  />
                </Form.Item>
              ) : null}
            </Card>

            <Card size="small" title="Batasi Pemakaian">
              <Form.Item label="Total kuantitas tersedia" name="is_unlimited">
                <Radio.Group buttonStyle="solid">
                  <Radio.Button value={1}>Tidak terbatas</Radio.Button>
                  <Radio.Button value={0}>Tentukan batas</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {unlimited === 0 ? (
                <Form.Item label="Qty total" name="qty" rules={[{ required: true }]}>
                  <Input type="number" />
                </Form.Item>
              ) : null}

              <Form.Item label="Batas per pelanggan (opsional)" name="max_per_user">
                <Input type="number" />
              </Form.Item>
            </Card>
          </Card>
        </Col>

        {/* RIGHT - Sidebar (iSeller style) */}
        <Col xs={24} lg={8}>
          <div style={{ position: "sticky", top: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            <Card title="Status">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>{isActive === 1 ? "Aktif" : "Nonaktif"}</div>
                <Switch
                  checked={isActive === 1}
                  onChange={(v) => form.setFieldValue("is_active", v ? 1 : 2)}
                />
              </div>
            </Card>

            <Card title="Tampilkan">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>Toko Online</div>
                <Switch
                  checked={isEcommerce === 1}
                  onChange={(v) => form.setFieldValue("is_ecommerce", v ? 1 : 0)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>Point of Sale</div>
                <Switch
                  checked={isPos === 1}
                  onChange={(v) => form.setFieldValue("is_pos", v ? 1 : 0)}
                />
              </div>
            </Card>

            <Card title="Rentang Waktu">
              <Form.Item label="Tanggal Mulai" name="started_at" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>

              <Form.Item name="no_expiry" valuePropName="checked">
                <Checkbox
                  checked={noExpiry === 1}
                  onChange={(e) => form.setFieldValue("no_expiry", e.target.checked ? 1 : 0)}
                >
                  Tidak ada Kadaluarsa
                </Checkbox>
              </Form.Item>

              {noExpiry === 0 ? (
                <Form.Item label="Tanggal Selesai" name="expired_at" rules={[{ required: true }]}>
                  <Input type="date" />
                </Form.Item>
              ) : null}
            </Card>

            <Card title="Berlaku pada">
              <Form.Item name="days_of_week" style={{ marginBottom: 0 }}>
                <Checkbox.Group options={dayOptions} />
              </Form.Item>
            </Card>
          </div>
        </Col>
      </Row>
    </Form>
  );
}
