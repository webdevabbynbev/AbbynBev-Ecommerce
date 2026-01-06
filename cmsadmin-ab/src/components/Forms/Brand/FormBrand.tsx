import React, { useEffect } from "react";
import { Form, Input, Button, Switch, message, Select } from "antd";
import http from "../../../api/http";
import { COUNTRY_OPTIONS } from "../../../constants/countries";

export type BrandPayload = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  country?: string | null;
  website?: string | null;
  isActive?: number;
};

export type BrandRecord = BrandPayload & {
  id: number | string;
  slug: string;
};

type FormBrandProps = {
  data?: BrandRecord;
  handleClose: () => void;
  fetch?: () => void;
};

const FormBrand: React.FC<FormBrandProps> = ({ data, handleClose, fetch }) => {
  const [form] = Form.useForm<BrandPayload>();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        description: data.description ?? undefined,
        logoUrl: data.logoUrl ?? undefined,
        bannerUrl: data.bannerUrl ?? undefined,
        country: data.country ?? undefined,
        website: data.website ?? undefined,
        isActive: typeof data.isActive === "number" ? data.isActive : 1,
      });
    } else {
      form.setFieldsValue({ isActive: 1 });
    }
  }, [data, form]);

  const normalizePayload = (values: BrandPayload): BrandPayload => {
    return {
      name: values.name?.trim(),
      description: values.description?.trim() || undefined,
      logoUrl: values.logoUrl?.trim() || undefined,
      bannerUrl: values.bannerUrl?.trim() || undefined,
      country: values.country?.trim() || undefined,
      website: values.website?.trim() || undefined,
      isActive:
        typeof values.isActive === "number"
          ? values.isActive
          : values.isActive
          ? 1
          : 0,
    };
  };

  const onFinish = async (values: BrandPayload) => {
    try {
      const payload = normalizePayload(values);

      if (data) {
        await http.put(`/admin/brands/${data.slug}`, payload);
        message.success("Brand updated");
      } else {
        await http.post(`/admin/brands`, payload);
        message.success("Brand created");
      }

      form.resetFields();
      handleClose();
      fetch?.();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to submit brand");
    }
  };

  const onFinishFailed = () => {
    message.error("Please check the form again.");
  };

  return (
    <Form<BrandPayload>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Name is required." }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item label="Logo URL" name="logoUrl">
        <Input placeholder="https://…" />
      </Form.Item>

      <Form.Item label="Banner URL" name="bannerUrl">
        <Input placeholder="https://…" />
      </Form.Item>

      {/* <Form.Item label="Country" name="country">
        <Select
          showSearch
          allowClear
          placeholder="Select country"
          optionFilterProp="label"
          options={COUNTRY_OPTIONS}
        />
      </Form.Item> */}
      {/* 
      <Form.Item
        label="Website"
        name="website"
        rules={[{ type: "url", message: "Please input a valid URL." }]}
      >
        <Input placeholder="https://example.com" />
      </Form.Item> */}

      <Form.Item label="Active" name="isActive" valuePropName="checked">
        {}
        <Switch
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#fff",
          }}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormBrand;
