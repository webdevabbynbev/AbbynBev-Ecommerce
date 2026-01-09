import React from "react";
import {
  Button,
  Row,
  Col,
  Card,
  Form,
  notification,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import moment from "moment";
import MainLayout from "../layout/MainLayout";
import history from "../utils/history";
import http from "../api/http";
import helper from "../utils/helper";
import FormBasic from "../components/Forms/Product/FormBasic";
import FormCategory from "../components/Forms/Product/FormCategory";
import FormDiscount from "../components/Forms/Product/FormDiscount";
import type { DiscountType } from "../components/Forms/Product/FormDiscount";
import FormAttribute from "../components/Forms/Product/FormAttribute";
import type { AttributeRow, CombinationRow } from "../components/Forms/Product/FormAttribute";
import FormSeo from "../components/Forms/Product/FormSeo";
import { useNavigate } from "react-router-dom";


type MediaItem = {
  url: string;
  type: 1 | 2;
};

type ProductDetail = {
  id: number;
  name: string;
  description?: string;
  basePrice?: number;
  weight?: number;
  masterSku?: string;
  status?: string;
  isFlashsale?: boolean;
  tagId?: number;
  brandId?: number;
  personaId?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  medias?: MediaItem[];
  discounts?: {
    type: number;
    value: string;
    maxValue?: string;
    startDate: string;
    endDate: string;
  }[];
  variants?: any[];
};

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<any>();
  const [isUpdate, setIsUpdate] = React.useState<number | null>(null);
  const [attributes, setAttributes] = React.useState<AttributeRow[]>([]);
  const [combinations, setCombinations] = React.useState<CombinationRow[]>([]);
  const [medias, setMedias] = React.useState<MediaItem[]>([]);
  const [discount, setDiscount] = React.useState<DiscountType>({
    type: 1,
    value: "",
    max_value: "",
    start_date: "",
    end_date: "",
  });

  React.useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) fetchProductDetail(id);
  }, []);

  const fetchProductDetail = async (id: string) => {
    try {
      const res = await http.get(`/admin/product/${id}`);
      const product: ProductDetail = res?.data?.serve;

      if (!product) return;
      setIsUpdate(product.id);
      if (product.medias?.length) setMedias(product.medias);
      if (product.discounts?.length) {
        const d = product.discounts[0];
        setDiscount({
          type: d.type,
          value: d.value,
          max_value: d.maxValue || "",
          start_date: moment(d.startDate).format("YYYY-MM-DDTHH:mm"),
          end_date: moment(d.endDate).format("YYYY-MM-DDTHH:mm"),
        });
      }

      if (product.variants?.length) {
        const { attributes, combinations } = transformToStructuredData(product.variants);
        setAttributes(attributes);
        setCombinations(combinations);
      }

      form.setFieldsValue({
        name: product.name,
        description: product.description,
        base_price: helper.formatRupiah(product.basePrice || ""),
        weight: product.weight,
        master_sku: product.masterSku,
        status: product.status,
        is_flashsale: product.isFlashsale,
        tag_id: product.tagId,
        brand_id: product.brandId,
        persona_id: product.personaId,
        meta_ai: 1,
        meta_title: product.metaTitle,
        meta_description: product.metaDescription,
        meta_keywords: product.metaKeywords,
      });
    } catch (err: any) {
      console.error(err);
      message.error("Failed to fetch product detail.");
    }
  };

  const transformToStructuredData = (variants: any[]) => {
    const attributes: Record<string, AttributeRow> = {};
    const combinations: CombinationRow[] = [];

    variants.forEach((variant, index) => {
      variant.attributes.forEach((attr: any) => {
        const attrId = attr.attributeId;
        const attrValue = {
          label: attr.value,
          value: attr.id,
        };

        if (!attributes[attrId]) {
          attributes[attrId] = {
            attribute_id: attrId,
            values: [],
          };
        }

        const exists = attributes[attrId].values.some((v) => v.value === attr.id);
        if (!exists) attributes[attrId].values.push(attrValue);
      });

      combinations.push({
        key: index,
        combination: variant.attributes.map((attr: any) => attr.id),
        display: variant.attributes.map((attr: any) => attr.value),
        price: helper.formatRupiah(variant.price || ""),
        stock: variant.stock,
        barcode: variant.barcode,
      });
    });

    return { attributes: Object.values(attributes), combinations };
  };

  const onFinish = async (values: any) => {
    if (!medias.length) {
        notification.error({ message: "Media is required", placement: "bottomRight" });
        return;
    }

    const toNumber = (v: any) => Number(String(v ?? "").replace(/\./g, "")) || 0;
    const toIsoOrNull = (v?: string | null) => (v ? v : null);
    const tag_ids = values.tag_id ? [values.tag_id] : [];
    const discounts = discount?.value? [
            {
            type: discount.type,
            value:
                discount.type === 1
                ? Number(discount.value) || 0
                : toNumber(discount.value),
            max_value: discount.type === 1 ? toNumber(discount.max_value) : undefined,
            start_date: toIsoOrNull(discount.start_date),
            end_date: toIsoOrNull(discount.end_date),
            },
        ]
        : [];

    const payload = {
        name: values.name,
        description: values.description,
        base_price: toNumber(values.base_price),
        weight: Number(values.weight) || 0,
        status: values.status ?? "draft",
        is_flashsale: Boolean(values.is_flashsale),
        category_type_id: values.category_type_id,
        brand_id: values.brand_id,
        persona_id: values.persona_id,
        tag_ids,
        concern_option_ids: values.concern_option_ids ?? [],
        profile_category_option_ids: values.profile_category_option_ids ?? [],
        master_sku: values.master_sku,
        medias,
        discounts,
        variants: (combinations || []).map((c) => ({
        combination: c.combination,
        price: toNumber(c.price),
        stock: Number(c.stock) || 0,
        barcode: c.barcode,
        })),
        meta_ai: values.meta_ai,
        meta_title: values.meta_title,
        meta_description: values.meta_description,
        meta_keywords: values.meta_keywords,
    };

    try {
        if (isUpdate) {
        await http.put(`/admin/product/${isUpdate}`, payload);
        message.success("Product updated successfully!");
        } else {
        await http.post(`/admin/product`, payload);
        message.success("Product created successfully!");
        }

        form.resetFields();
        setMedias([]);
        setAttributes([]);
        setCombinations([]);
        setDiscount({ type: 1, value: "", max_value: "", start_date: "", end_date: "" });
        history.push("/inventory-product");
    } catch (err: any) {
        console.error(err);
        notification.error({
        message: err?.response?.data?.message || "Failed to save product.",
        placement: "bottomRight",
        });
    }
    };

  return (
    <MainLayout title="Form Product">
      <Form
        autoComplete="off"
        form={form}
        name="product_form"
        layout="vertical"
        onFinish={onFinish}
      >
        {/* Header */}
        <Card style={{ marginBottom: 10 }} styles={{ body: { padding: "10px 20px" } }}>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              icon={<ArrowLeftOutlined />}
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate("/inventory-product")}
            >
              Back to list
            </Button>

            <Button htmlType="submit" icon={<SaveOutlined />} type="primary">
              Save
            </Button>
          </div>
        </Card>

        <Row gutter={[12, 12]}>
          {/* LEFT SIDE */}
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 10 }}>
              <FormBasic
                setMedias={setMedias}
                medias={medias}
                form={form}
              />
            </Card>

            <Card style={{ marginBottom: 10 }}>
              <FormAttribute
                attributes={attributes}
                setAttributes={setAttributes}
                combinations={combinations}
                setCombinations={setCombinations}
              />
            </Card>
          </Col>

          {/* RIGHT SIDE */}
          <Col xs={24} lg={8}>
            <Card style={{ marginBottom: 10 }}>
              <FormCategory />
            </Card>
            <Card style={{ marginBottom: 10 }}>
              <FormDiscount discount={discount} setDiscount={setDiscount} />
            </Card>
            <Card style={{ marginBottom: 10 }}>
              <FormSeo form={form} />
            </Card>
          </Col>
        </Row>

        {/* Footer */}
        <Card
          style={{ marginBottom: 10 }}
          bodyStyle={{ padding: "10px 20px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              icon={<ArrowLeftOutlined />}
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate("/inventory-product")}
            >
              Back to list
            </Button>

            <Button htmlType="submit" icon={<SaveOutlined />} type="primary">
              Save
            </Button>
          </div>
        </Card>
      </Form>
    </MainLayout>
  );
};

export default AddProductPage;
