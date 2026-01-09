import React from "react";
import { Form, Input, InputNumber, Button, message } from "antd";
import type { FormProps } from "antd";
import http from "../../../api/http";

export type ConcernRecord = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  position?: number | null;
};

type FormConcernProps = {
  data?: ConcernRecord | false;
  handleClose: () => void;
  fetch?: () => void;
};

type ConcernPayload = {
  id?: number;
  name: string;
  description?: string;
  position?: number | null;
};

const FormConcern: React.FC<FormConcernProps> = ({ data, handleClose }) => {
  const [form] = Form.useForm<ConcernPayload>();

  React.useEffect(() => {
    form.resetFields();
    if (data) {
      form.setFieldsValue({
        id: data.id,
        name: data.name,
        description: data.description ?? "",
        position: data.position ?? undefined,
      });
    }
  }, [data]);

  const onFinish: FormProps<ConcernPayload>["onFinish"] = async (values) => {
    try {
      if (data) {
        await http.put(`/admin/concern/${(data as ConcernRecord).slug}`, values);
        message.success("Concern updated");
      } else {
        await http.post("/admin/concern", values);
        message.success("Concern created");
      }
      form.resetFields();
      handleClose();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to submit");
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ name: "", description: "", position: undefined }}
    >
      {}
      <Form.Item name="id" hidden>
        <input type="hidden" />
      </Form.Item>

      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Name is required" }]}
      >
        <Input placeholder="Concern name" />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <Input.TextArea placeholder="Description (optional)" rows={4} />
      </Form.Item>

      <Form.Item label="Position" name="position">
        <InputNumber placeholder="Position (optional)" style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormConcern;
