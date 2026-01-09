import React from "react";
import { Form, Input, Button, Select, Switch, message } from "antd";
import type { FormProps } from "antd";
import http from "../../../api/http";

export type ProfileCategoryOptionRecord = {
  id: number;
  profileCategoriesId: number;
  label: string;
  value: string;
  isActive?: boolean;
  category?: { id: number; name: string } | null;
};

type Props = {
  data?: ProfileCategoryOptionRecord | false;
  handleClose: () => void;
  categoryId?: number;
};

type Payload = {
  profileCategoriesId?: number;
  label: string;
  value: string;
  isActive?: boolean;
};

const FormProfileCategoryOption: React.FC<Props> = ({ data, handleClose, categoryId }) => {
  const [form] = Form.useForm<Payload>();
  const [categoryChoices, setCategoryChoices] = React.useState<
    { value: number; label: string }[]
  >([]);

  React.useEffect(() => {
    (async () => {
      if (categoryId) return;
      try {
        const resp = await http.get(
          "/admin/profile-categories?q=&page=1&per_page=9999"
        );
        const r = resp?.data;
        const list = Array.isArray(r?.data) ? r.data : r?.serve?.data || [];
        setCategoryChoices(
          (list || []).map((c: any) => ({ value: c.id, label: c.name }))
        );
      } catch {
      }
    })();
  }, [categoryId]);

  React.useEffect(() => {
    form.resetFields();
    if (data) {
      form.setFieldsValue({
        profileCategoriesId: data.profileCategoriesId ?? categoryId,
        label: data.label,
        value: data.value,
        isActive: data.isActive ?? true,
      });
    } else {
      form.setFieldsValue({
        profileCategoriesId: categoryId,
        label: "",
        value: "",
        isActive: true,
      });
    }
  }, [data, categoryId]);

  const onFinish: FormProps<Payload>["onFinish"] = async (values) => {
    try {
      const payload: Payload = {
        ...values,
        profileCategoriesId: values.profileCategoriesId ?? categoryId,
      };

      if (!payload.profileCategoriesId) {
        message.error("Category is required");
        return;
      }

      if (data && (data as ProfileCategoryOptionRecord).id) {
        await http.put(`/admin/profile-category-options/${data.id}`, payload);
        message.success("Profile category option updated");
      } else {
        await http.post(`/admin/profile-category-options`, payload);
        message.success("Profile category option created");
      }

      form.resetFields();
      handleClose();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to submit");
    }
  };

  return (
    <Form layout="vertical" form={form} onFinish={onFinish}>
      {!categoryId && (
        <Form.Item
          label="Category"
          name="profileCategoriesId"
          rules={[{ required: true, message: "Category is required" }]}
        >
          <Select
            placeholder="Select category"
            options={categoryChoices}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      )}

      <Form.Item
        label="Label"
        name="label"
        rules={[{ required: true, message: "Label is required" }]}
      >
        <Input placeholder="e.g. Oily, Dry" />
      </Form.Item>

      <Form.Item
        label="Value"
        name="value"
        rules={[{ required: true, message: "Value is required" }]}
      >
        <Input placeholder="e.g. oily, dry" />
      </Form.Item>

      <Form.Item label="Active" name="isActive" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormProfileCategoryOption;
