import React from "react";
import { Form, Input, Button } from "antd";
import type { FormInstance } from "antd";
import http from "../../../api/http";

type PersonaRecord = {
  id: number | string;
  name: string;
  slug: string;
};

type FormValues = {
  id?: number | string;
  name: string;
};

interface FormPersonaPropss {
  data?: PersonaRecord;
  handleClose: () => void;
  fetch?: () => void;
}

const FormPersona: React.FC<FormPersonaPropss> = ({ data, handleClose }) => {
  const [form] = Form.useForm<FormValues>();

  const onFinish = async (values: FormValues) => {
    try {
      if (data) {
        const res = await http.put(`/admin/personas/${data.slug}`, {
          name: values.name,
        });
        if (res) {
          form.resetFields();
          handleClose();
        }
      } else {
        const res = await http.post("/admin/personas", {
          name: values.name,
        });
        if (res) {
          form.resetFields();
          handleClose();
        }
      }
    } catch (err) {
      console.error("Save persona failed:", err);
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
      name="formPersona"
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

export default FormPersona;
