import React, { useEffect, useState } from "react";
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

// helper: bersihin "Rp 1.234.000" -> "1234000"
const onlyDigits = (v: any) => String(v ?? "").replace(/[^\d]/g, "");

export default function DiscountFormPage({ mode }: Props) {
  const [form] = Form.useForm();
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  // state dari TableDiscount saat klik Edit
  const fromState = (location.state as any) || null;

  // options
  const [variantOptions, setVariantOptions] = useState<{ label: string; value: number }[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ label: string; value: number }[]>([]);

  const [brandOptions, setBrandOptions] = useState<{ label: string; value: number }[]>([]);
  const [productOptions, setProductOptions] = useState<{ label: string; value: number }[]>([]);

  const [variantLoading, setVariantLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [brandLoading, setBrandLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);

  // ✅ BRAND OPTIONS
  const searchBrands = async (keyword: string) => {
    const q = String(keyword ?? "").trim(); // boleh kosong
    setBrandLoading(true);
    try {
      const resp: any = await http.get(
        `/admin/discount-options/brands?q=${encodeURIComponent(q)}&page=1&per_page=20`
      );
      const rows = resp?.data?.serve?.data ?? [];
      setBrandOptions(
        rows.map((b: any) => ({
          value: Number(b.id),
          label: `${b.name ?? "Brand"} (id:${b.id})`,
        }))
      );
    } catch (e1: any) {
      // fallback
      try {
        const resp2: any = await http.get(
          `/admin/brands?q=${encodeURIComponent(q)}&page=1&per_page=20`
        );
        const rows2 = resp2?.data?.serve?.data ?? resp2?.data?.serve ?? [];
        setBrandOptions(
          rows2.map((b: any) => ({
            value: Number(b.id),
            label: `${b.name ?? b.title ?? "Brand"} (id:${b.id})`,
          }))
        );
      } catch (e2: any) {
        message.error(
          e2?.response?.data?.message ??
            e1?.response?.data?.message ??
            "Gagal ambil brand"
        );
      }
    } finally {
      setBrandLoading(false);
    }
  };

  // ✅ PRODUCT OPTIONS
  const searchProducts = async (keyword: string) => {
    const q = String(keyword ?? "").trim(); // boleh kosong
    setProductLoading(true);
    try {
      const resp: any = await http.get(
        `/admin/discount-options/products?q=${encodeURIComponent(q)}&page=1&per_page=20`
      );
      const rows = resp?.data?.serve?.data ?? [];
      setProductOptions(
        rows.map((p: any) => ({
          value: Number(p.id),
          label: `${p.name ?? "Produk"} (id:${p.id})`,
        }))
      );
    } catch (e1: any) {
      // fallback
      try {
        const resp2: any = await http.get(
          `/admin/product?name=${encodeURIComponent(q)}&page=1&per_page=10`
        );
        const products = resp2?.data?.serve?.data ?? [];
        setProductOptions(
          products.map((p: any) => ({
            value: Number(p.id),
            label: `${p.name ?? "Produk"} (id:${p.id})`,
          }))
        );
      } catch (e2: any) {
        message.error(
          e2?.response?.data?.message ??
            e1?.response?.data?.message ??
            "Gagal ambil produk"
        );
      }
    } finally {
      setProductLoading(false);
    }
  };

  /**
   * ✅ VARIANT OPTIONS (NEW)
   * Sekarang "Varian Produk" di CMS = attribute_values.
   * Endpoint backend return:
   *   { id, value, attributeName }
   * id = attribute_value_id (target_type=5)
   */
  const searchVariants = async (keyword: string) => {
    const q = String(keyword ?? "").trim(); // boleh kosong
    setVariantLoading(true);
    try {
      const resp: any = await http.get(
        `/admin/discount-options/variants?q=${encodeURIComponent(q)}&page=1&per_page=30`
      );
      const rows = resp?.data?.serve?.data ?? [];
      setVariantOptions(
        rows.map((v: any) => ({
          value: Number(v.id), // attribute_value_id
          label: `${v.attributeName ?? "Atribut"}: ${v.value ?? "-"} (id:${v.id})`,
        }))
      );
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Gagal ambil attribute values");
      setVariantOptions([]);
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

      // ✅ targets
      brand_ids: data?.brandIds ?? [],
      product_ids: data?.productIds ?? [],
      // ✅ sekarang variant_ids itu attribute_value_ids
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
      days_of_week: data?.daysOfWeek?.map(String) ?? ["0", "1", "2", "3", "4", "5", "6"],
    };
  };

  const loadEdit = async () => {
    if (mode !== "edit") return;

    if (fromState) {
      form.setFieldsValue(mapApiToForm(fromState));
    }

    try {
      setLoading(true);
      const resp: any = await http.get(`/admin/discounts/${id}`);
      const data = resp?.data?.serve;
      if (data) form.setFieldsValue(mapApiToForm(data));
    } catch {
      // aman
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        days_of_week: ["0", "1", "2", "3", "4", "5", "6"],

        brand_ids: [],
        product_ids: [],
        variant_ids: [],
      });
    }

    loadEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valueType = Form.useWatch("value_type", form) ?? 1;
  const appliesTo = Form.useWatch("applies_to", form) ?? 0;
  const eligibility = Form.useWatch("eligibility_type", form) ?? 0;
  const unlimited = Form.useWatch("is_unlimited", form) ?? 1;
  const noExpiry = Form.useWatch("no_expiry", form) ?? 1;

  const isActive = Form.useWatch("is_active", form) ?? 1;
  const isEcommerce = Form.useWatch("is_ecommerce", form) ?? 1;
  const isPos = Form.useWatch("is_pos", form) ?? 1;

  const onSubmit = async () => {
    await form.validateFields();
    const values = form.getFieldsValue(true);

    const payload: any = { ...values };

    // normalisasi rupiah
    if (payload.value_type === 2) payload.value = onlyDigits(payload.value);
    if (payload.max_discount) payload.max_discount = onlyDigits(payload.max_discount);
    if (payload.min_order_amount) payload.min_order_amount = onlyDigits(payload.min_order_amount);

    if (payload.is_unlimited === 1) payload.qty = null;
    if (payload.no_expiry === 1) payload.expired_at = null;

    // bersihin payload sesuai applies_to
    if (payload.applies_to !== 1) payload.min_order_amount = "";
    if (payload.applies_to !== 4) payload.brand_ids = [];
    if (payload.applies_to !== 5) payload.product_ids = [];
    if (payload.applies_to !== 3) payload.variant_ids = [];

    if (payload.eligibility_type !== 1) payload.customer_ids = [];

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

  return (
    <Form form={form} layout="vertical">
      {/* Hidden fields */}
      <Form.Item name="is_active" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="is_ecommerce" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="is_pos" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="no_expiry" hidden>
        <Input />
      </Form.Item>

      <Row gutter={16}>
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
                      onChange={() => {
                        form.setFieldValue("value", "");
                        form.setFieldValue("max_discount", "");
                      }}
                      options={[
                        { value: 1, label: "Persen (%)" },
                        { value: 2, label: "Nominal (Rp)" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Nilai" name="value" rules={[{ required: true }]}>
                    {valueType === 1 ? (
                      <Input type="number" suffix="%" />
                    ) : (
                      <Input
                        prefix="Rp"
                        onChange={(e) =>
                          form.setFieldValue("value", helper.formatRupiah(e.target.value))
                        }
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
                  onChange={() => {
                    form.setFieldValue("min_order_amount", "");
                    form.setFieldValue("brand_ids", []);
                    form.setFieldValue("product_ids", []);
                    form.setFieldValue("variant_ids", []);
                  }}
                  options={[
                    { value: 0, label: "Semua Pesanan" },
                    { value: 1, label: "Pesanan Minimal" },
                    { value: 4, label: "Brand" },
                    { value: 5, label: "Produk" },
                    { value: 3, label: "Varian Produk (Attribute Values)" },
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

              {appliesTo === 4 ? (
                <Form.Item label="Pilih Brand" name="brand_ids" rules={[{ required: true }]}>
                  <Select
                    mode="multiple"
                    showSearch
                    filterOption={false}
                    onSearch={searchBrands}
                    onFocus={() => searchBrands("")}
                    onDropdownVisibleChange={(open) => open && searchBrands("")}
                    options={brandOptions}
                    loading={brandLoading}
                    placeholder="Klik untuk lihat list, atau ketik untuk cari..."
                  />
                </Form.Item>
              ) : null}

              {appliesTo === 5 ? (
                <Form.Item label="Pilih Produk" name="product_ids" rules={[{ required: true }]}>
                  <Select
                    mode="multiple"
                    showSearch
                    filterOption={false}
                    onSearch={searchProducts}
                    onFocus={() => searchProducts("")}
                    onDropdownVisibleChange={(open) => open && searchProducts("")}
                    options={productOptions}
                    loading={productLoading}
                    placeholder="Klik untuk lihat list, atau ketik untuk cari..."
                  />
                </Form.Item>
              ) : null}

              {appliesTo === 3 ? (
                <Form.Item
                  label="Pilih Attribute Values"
                  name="variant_ids"
                  rules={[{ required: true }]}
                >
                  <Select
                    mode="multiple"
                    showSearch
                    filterOption={false}
                    onSearch={searchVariants}
                    onFocus={() => searchVariants("")}
                    onDropdownVisibleChange={(open) => open && searchVariants("")}
                    options={variantOptions}
                    loading={variantLoading}
                    placeholder="Klik untuk lihat list attribute, atau ketik untuk cari..."
                  />
                </Form.Item>
              ) : null}
            </Card>

            <Card size="small" title="Pengaturan Pelanggan" style={{ marginBottom: 12 }}>
              <Form.Item label="Dapat dipakai oleh" name="eligibility_type">
                <Select
                  onChange={(v) => {
                    if (v === 0) form.setFieldValue("customer_ids", []);
                  }}
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

        <Col xs={24} lg={8}>
          <div
            style={{
              position: "sticky",
              top: 12,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div>Toko Online</div>
                <Switch
                  checked={isEcommerce === 1}
                  onChange={(v) => form.setFieldValue("is_ecommerce", v ? 1 : 0)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>Point of Sale</div>
                <Switch checked={isPos === 1} onChange={(v) => form.setFieldValue("is_pos", v ? 1 : 0)} />
              </div>
            </Card>

            <Card title="Rentang Waktu">
              <Form.Item label="Tanggal Mulai" name="started_at" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>

              <div style={{ marginBottom: 10 }}>
                <Checkbox
                  checked={noExpiry === 1}
                  onChange={(e) => form.setFieldValue("no_expiry", e.target.checked ? 1 : 0)}
                >
                  Tidak ada Kadaluarsa
                </Checkbox>
              </div>

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
