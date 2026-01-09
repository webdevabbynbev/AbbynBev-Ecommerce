import React, { useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import http from "../../../api/http";

type SettingData = {
  id?: number | string;
  key: string;
  value: string;
  group: string;
};

type FormSettingProps = {
  data?: SettingData;
  handleClose: () => void;
  fetch?: () => void;
};

const FormSetting: React.FC<FormSettingProps> = (props) => {
  const [form] = Form.useForm<SettingData>();
  const onFinish = async (values: SettingData) => {
    try {
      if (props.data) {
        values.id = props.data.id;
        const res = await http.put("/admin/settings", values);
        if (res) {
          message.success("Setting updated successfully!");
          form.resetFields();
          props.handleClose();
        }
      } else {
        const res = await http.post("/admin/settings", values);
        if (res) {
          message.success("Setting created successfully!");
          form.resetFields();
          props.handleClose();
        }
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      message.error("Submission failed, please try again.");
    }
  };

  const onFinishFailed = (errorInfo: unknown) => {
    console.warn("Failed:", errorInfo);
  };
  const initValues: SettingData = {
    id: props.data?.id || "",
    key: props.data?.key || "",
    value: props.data?.value || "",
    group: props.data?.group || "",
  };

  useEffect(() => {
    form.setFieldsValue(initValues);
  }, [props.data]);
  return (
    <Form<SettingData>
      form={form}
      name="settingForm"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item name="id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        label="Key"
        name="key"
        rules={[{ required: true, message: "Key is required." }]}
      >
        <Input placeholder="Enter key" />
      </Form.Item>

      <Form.Item
        label="Group"
        name="group"
        rules={[{ required: true, message: "Group is required." }]}
      >
        <Input placeholder="Enter group" />
      </Form.Item>

      <Form.Item
        label="Value"
        name="value"
        rules={[{ required: true, message: "Value is required." }]}
      >
        <Input placeholder="Enter value" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormSetting;
