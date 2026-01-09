import React from "react";
import { Form, Input, Button } from "antd";
import type { FormInstance } from "antd";
import http from "../../../api/http";

type TagRecord = {
  id: number | string;
  name: string;
  slug: string;
};

type FormValues = {
  id?: number | string;
  name: string;
};

interface FormTagProps {
  data?: TagRecord;
  handleClose: () => void;
  fetch?: () => void;
}

const FormTag: React.FC<FormTagProps> = ({ data, handleClose }) => {
  const [form] = Form.useForm<FormValues>();

  const onFinish = async (values: FormValues) => {
    try {
      if (data) {
        const res = await http.put(`/admin/tags/${data.slug}`, {
          name: values.name,
        });
        if (res) {
          form.resetFields();
          handleClose();
        }
      } else {
        const res = await http.post("/admin/tags", {
          name: values.name,
        });
        if (res) {
          form.resetFields();
          handleClose();
        }
      }
    } catch (err) {
      console.error("Save tag failed:", err);
    }
  };

  const onFinishFailed = (errorInfo: unknown) => {
    console.log("Failed:", errorInfo);
  };

  const init: Partial<FormValues> = {
    id: data?.id ?? "",
    name: data?.name ?? "",
  };

  React.useEffect(() => {
    form.setFieldsValue(init);
  }, [data, form, init.id, init.name]);

  return (
    <Form<FormValues>
      form={form as FormInstance<FormValues>}
      name="formTag"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item<FormValues> label="ID" name="id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item<FormValues>
        label="Name"
        name="name"
        rules={[{ required: true, message: "Name required." }]}
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormTag;
