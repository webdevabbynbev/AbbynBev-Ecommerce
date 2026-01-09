import React from "react";
import { Form, Input, Button, Select, Space } from "antd";
import http from "../../../api/http";

export type CategoryTypeRecord = {
  id: number | string;
  name: string;
  slug: string;
  parentId?: number | null;
  level?: number | null;
  children?: CategoryTypeRecord[];
};

type FormValues = {
  id?: number | string;
  name: string;
  parentId?: number | null;
  level?: number | null;
};

type FormCategoryTypeProps = {
  data?: CategoryTypeRecord;
  handleClose: () => void;
  fetch?: () => void;
};

const flattenTree = (nodes: CategoryTypeRecord[] = [], depth = 0): { value: number; label: string; level: number }[] => {
  const pad = (n: number) => (n > 0 ? "— ".repeat(n) : "");
  const arr: { value: number; label: string; level: number }[] = [];
  for (const n of nodes) {
    if (typeof n.id === "number") {
      arr.push({ value: n.id, label: `${pad(depth)}${n.name}`, level: n.level ?? depth + 1 });
    }
    if (n.children && n.children.length) {
      arr.push(...flattenTree(n.children, depth + 1));
    }
  }
  return arr;
};

const FormCategoryType: React.FC<FormCategoryTypeProps> = ({ data, handleClose }) => {
  const [form] = Form.useForm<FormValues>();
  const [parentOptions, setParentOptions] = React.useState<{ value: number; label: string; level: number }[]>([]);
  const isEdit = !!data;

  React.useEffect(() => {
    const init: FormValues = {
      id: data?.id,
      name: data?.name ?? "",
      parentId: data?.parentId ?? null,
      level: data?.level ?? (data?.parentId ? 2 : 1),
    };
    form.setFieldsValue(init);
  }, [data]);

  React.useEffect(() => {
    const fetchParents = async () => {
      try {
        const resp = await http.get("/admin/category-types/list");
        const list = (resp?.data?.serve ?? []) as CategoryTypeRecord[];
        const opts = flattenTree(list);
        setParentOptions(opts);
      } catch {
        setParentOptions([]);
      }
    };
    fetchParents();
  }, []);

  const handleParentChange = (parentId?: number | null) => {
    if (!parentId) {
      form.setFieldValue("level", 1);
      return;
    }
    const opt = parentOptions.find((o) => o.value === parentId);
    const parentLevel = opt?.level ?? 1;
    form.setFieldValue("level", parentLevel + 1);
  };

  const onFinish = async (values: FormValues) => {
    const payload: any = {
      name: values.name,
      ...(values.parentId ? { parentId: values.parentId } : {}),
      ...(values.level ? { level: values.level } : {}),
    };

    try {
      if (isEdit && data?.slug) {
        await http.put(`/admin/category-types/${data.slug}`, payload);
      } else {
        await http.post("/admin/category-types", payload);
      }
      form.resetFields();
      handleClose();
    } catch (e) {
      console.error(e);
    }
  };

  const onFinishFailed = () => {};

  return (
    <Form<FormValues>
      form={form}
      name="formCategoryType"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      {}
      <Form.Item name="id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Name is required." }]}
      >
        <Input placeholder="Category name" />
      </Form.Item>

      <Form.Item label="Parent" name="parentId">
        <Select
          allowClear
          placeholder="Select parent (optional)"
          options={parentOptions}
          onChange={(v) => handleParentChange(v ?? null)}
        />
      </Form.Item>

      <Form.Item label="Level" name="level">
        <Input disabled />
      </Form.Item>

      <Form.Item>
        <Space style={{ width: "100%" }}>
          <Button onClick={handleClose} style={{ marginLeft: "auto" }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" shape="round">
            Save & Close
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FormCategoryType;
