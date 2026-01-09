import type { FC } from "react";
import { Form, Input, Button } from "antd";
import http from "../../../api/http";
import helper from "../../../utils/helper";

interface FormValues {
  id?: number | string;
  name: string;
}

interface FormProfileProps {
  handleClose: () => void; 
}

const FormProfile: FC<FormProfileProps> = ({ handleClose }) => {
  const [form] = Form.useForm<FormValues>();

  const onFinish = async (values: FormValues) => {
    const storage = helper.isAuthenticated();
    if (!storage || !storage.user) return;

    values.id = storage.user.id;

    try {
      const res = await http.put("/users", values);

      if (res?.data?.serve?.name) {
        storage.user.name = res.data.serve.name;
        localStorage.setItem("session", JSON.stringify(storage));
        window.location.reload();
      }
      handleClose();
    } catch (error) {
      console.error("Update profile failed:", error);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  const initialValues: FormValues = {
    name: helper.isAuthenticated()?.user?.name || "",
  };

  return (
    <Form<FormValues>
      autoComplete="off"
      form={form}
      name="basic"
      layout="vertical"
      initialValues={initialValues}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="Nama"
        name="name"
        rules={[{ required: true, message: "Nama wajib diisi" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Update
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormProfile;
