import React from "react";
import { Form, Input, Button, Select, message } from "antd";
import type { FormInstance } from "antd/es/form";
import http from "../../../api/http";

type AdminFormProps = {
  data?: {
    id: number | string;
    name?: string;
    email?: string;
    role?: number | string;
  };
  handleClose: () => void;
};

type AdminFormValues = {
  id?: number | string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: number;
};

const { Option } = Select;

const FormAdmin: React.FC<AdminFormProps> = ({ data, handleClose }) => {
  const [form] = Form.useForm<AdminFormValues>();
  const isEdit = Boolean(data?.id);

  const splitName = (full?: string) => {
    if (!full) return { first: "", last: "" };
    const parts = full.trim().split(" ");
    if (parts.length === 1) return { first: parts[0], last: "" };
    return { first: parts.slice(0, -1).join(" "), last: parts.slice(-1).join(" ") };
  };

  const init = React.useMemo<AdminFormValues>(() => {
    const { first, last } = splitName(data?.name);
    return {
      id: data?.id,
      firstName: first,
      lastName: last,
      email: data?.email ?? "",
      password: "",
      role:
        typeof data?.role === "string"
          ? parseInt(data!.role, 10)
          : (data?.role as number) ?? 1,
    };
  }, [data]);

  React.useEffect(() => {
    (form as FormInstance<AdminFormValues>).setFieldsValue(init);
  }, [init, form]);

  const onFinish = async (values: AdminFormValues) => {
    try {
      if (isEdit) {
        const payload = {
          first_name: values.firstName.trim(),
          last_name: values.lastName.trim(),
          email: values.email.trim(),
          role: Number(values.role),
          password:
            values.password && values.password.trim().length > 0
              ? values.password
              : null,
        };

        await http.put(`/admin/users/${values.id}`, payload);
        message.success("Admin updated");
      } else {
        const payload = {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          role: Number(values.role),
          password: values.password,
        };

        await http.post(`/admin/users`, payload);
        message.success("Admin created");
      }

      form.resetFields();
      handleClose();
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.serve?.[0]?.message ||
        "Submission failed, please try again!";
      message.error(serverMsg);
      console.error(err);
    }
  };

  return (
    <Form<AdminFormValues>
      form={form}
      name="adminForm"
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item name="id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}>
        <Input placeholder="Enter first name" />
      </Form.Item>

      <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
        <Input placeholder="Enter last name" />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[{ required: true, type: "email" }]}
      >
        <Input placeholder="email@example.com" />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        tooltip={isEdit ? "Leave empty to keep current password" : undefined}
        rules={
          isEdit
            ? []
            : [
                { required: true, message: "Password is required" },
                { min: 6, message: "Min 6 characters" },
              ]
        }
      >
        <Input.Password
          placeholder={isEdit ? "Leave empty to keep current password" : "Enter password"}
          autoComplete="new-password"
        />
      </Form.Item>

      <Form.Item name="role" label="Role" rules={[{ required: true }]}>
        <Select placeholder="Select role">
          <Option value={1}>Admin</Option>
          <Option value={3}>Gudang</Option>
          <Option value={4}>Finance</Option>
          <Option value={5}>Media</Option>
          <Option value={6}>Cashier n Gudang</Option>
          <Option value={7}>Cashier</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormAdmin;
