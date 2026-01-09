import React, { useEffect } from "react";
import { Form, Button, Card, message } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import http from "../../../api/http";

type TermAndConditionsData = {
  value: string;
};

const FormTermAndConditions: React.FC = () => {
  const [form] = Form.useForm<TermAndConditionsData>();
  useEffect(() => {
    fetchTermAndConditions();
  }, []);
  const fetchTermAndConditions = async (): Promise<void> => {
    try {
      const response = await http.get("/admin/term-and-conditions");
      const data = response?.data?.serve;

      if (data?.value) {
        form.setFieldsValue({ value: data.value });
      } else {
        console.warn("Term and Conditions data is empty or undefined.");
      }
    } catch (error) {
      console.error("Failed to fetch term and conditions :", error);
      message.error("Failed to load term and conditions data");
    }
  };

  const onFinish = async (values: TermAndConditionsData): Promise<void> => {
    try {
      const res = await http.post("/admin/term-and-conditions", values, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res) {
        message.success("term and conditions updated successfully!");
        fetchTermAndConditions();
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      message.error("Submission failed, please try again!");
    }
  };

  return (
    <Card title="Term and Conditions Form" style={{ marginTop: 10 }}>
      <Form<TermAndConditionsData>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ width: "100%" }}
      >
        <Form.Item
          name="value"
          label="Term and Conditions content"
          rules={[{ required: true, message: "term and conditions content is required" }]}
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

export default FormTermAndConditions;
