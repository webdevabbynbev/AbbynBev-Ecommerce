import { Form, Input, Button } from "antd";
import type { FormInstance } from "antd/es/form";
import http from "../../../api/http"
import React from "react";

interface FormChangePasswordProps {
  handleClose: () => void;
  email?: string;
  authenticated?: boolean;
}

interface ChangePasswordValues {
  old_password: string;
  password: string;
  password_confirmation: string;
}

const FormChangePassword: React.FC<FormChangePasswordProps> = ({ handleClose }) => {
  const [form] = Form.useForm<ChangePasswordValues>();

  const onFinish = async (values: ChangePasswordValues) => {
    try {
      const res = await http.put("/profile/password", values);
      if (res) {
        await form.resetFields();
        handleClose();
      }
    } catch (error) {
      console.error("Change password failed:", error);
    }
  };

  const onFinishFailed = (errorInfo: unknown) => {
    console.error("Failed:", errorInfo);
  };

  return (
    <Form<ChangePasswordValues>
      autoComplete="off"
      form={form as FormInstance<ChangePasswordValues>}
      name="change-password"
      layout="vertical"
      initialValues={{
        old_password: "",
        password: "",
        password_confirmation: "",
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item<ChangePasswordValues>
        label="Old password"
        name="old_password"
        rules={[{ required: true, message: "Old password required." }]}
      >
        <Input.Password placeholder="Enter old password" />
      </Form.Item>

      <Form.Item<ChangePasswordValues>
        label="New password"
        name="password"
        rules={[
          { required: true, message: "Password required." },
          { min: 8, message: "Password must be at least 8 characters long." },
        ]}
      >
        <Input.Password placeholder="New password" />
      </Form.Item>

      <Form.Item<ChangePasswordValues>
        label="Re-type password"
        name="password_confirmation"
        rules={[
          { required: true, message: "Password required." },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Password not match"));
            },
          }),
        ]}
      >
        <Input.Password placeholder="Re-type your new password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Update
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormChangePassword;
