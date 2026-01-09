import React from "react";
import { Form, Input, Button } from "antd";
import http from "../../../api/http";

export type ProfileCategoryRecord = {
  id: number;
  name: string;
  type?: string | null;
};

type Props = {
  data?: ProfileCategoryRecord | null;
  handleClose: () => void;
};

type FormValues = {
  id?: number;
  name: string;
  type?: string;
};

const FormProfileCategory: React.FC<Props> = ({ data, handleClose }) => {
  const [form] = Form.useForm<FormValues>();

  React.useEffect(() => {
    form.setFieldsValue({
      id: data?.id,
      name: data?.name ?? "",
      type: data?.type ?? "",
    });
  }, [data, form]);

  const onFinish = async (values: FormValues) => {
    if (data?.id) {
      await http.put(`/admin/profile-categories/${data.id}`, values);
    } else {
      await http.post(`/admin/profile-categories`, values);
    }
    form.resetFields();
    handleClose();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Name required." }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Type" name="type">
        <Input placeholder="e.g. Skin, Hair" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormProfileCategory;
