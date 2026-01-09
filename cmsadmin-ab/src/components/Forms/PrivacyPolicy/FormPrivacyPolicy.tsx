import React, { useEffect } from "react";
import { Form, Button, Card, message } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import http from "../../../api/http";

type PrivacyPolicyData = {
  value: string;
};

const FormPrivacyPolicy: React.FC = () => {
  const [form] = Form.useForm<PrivacyPolicyData>();
  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async (): Promise<void> => {
    try {
      const response = await http.get("/admin/privacy-policy");
      const data = response?.data?.serve;

      if (data?.value) {
        form.setFieldsValue({ value: data.value });
      } else {
        console.warn("Privacy policy data is empty or undefined.");
      }
    } catch (error) {
      console.error("Failed to fetch privacy policy:", error);
      message.error("Failed to load privacy policy data");
    }
  };

  const onFinish = async (values: PrivacyPolicyData): Promise<void> => {
    try {
      const res = await http.post("/admin/privacy-policy", values, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res) {
        message.success("Privacy policy updated successfully!");
        fetchPrivacyPolicy();
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      message.error("Submission failed, please try again!");
    }
  };

  return (
    <Card title="Privacy Policy Form" style={{ marginTop: 10 }}>
      <Form<PrivacyPolicyData>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ width: "100%" }}
      >
        <Form.Item
          name="value"
          label="Privacy Policy Content"
          rules={[{ required: true, message: "Privacy policy content is required" }]}
        >
          <ReactQuill
            theme="snow"
            value={form.getFieldValue("value")}
            onChange={(value) => form.setFieldsValue({ value })}
            style={{ height: "20rem", width: "100%" }}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: "3.5rem" }}>
          <Button type="primary" htmlType="submit" shape="round">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FormPrivacyPolicy;
