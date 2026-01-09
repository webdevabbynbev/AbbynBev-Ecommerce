import React from "react";
import { Form, Input, Button } from "antd";
import http from "../../../api/http";

const { TextArea } = Input;

type FAQRecord = {
  id?: string | number;
  question: string;
  answer: string;
};

type FormFAQProps = {
  data?: FAQRecord;
  handleClose: () => void;
  fetch?: () => void;
};

const FormFAQ: React.FC<FormFAQProps> = ({ data, handleClose }) => {
  const [form] = Form.useForm<FAQRecord>();

  const onFinish = async (values: FAQRecord) => {
    try {
      if (data) {
        const res = await http.put(`/admin/faq/${data.id}`, values);
        if (res) {
          form.resetFields();
          handleClose();
        }
      } else {
        const res = await http.post("/admin/faq", values);
        if (res) {
          form.resetFields();
          handleClose();
        }
      }
    } catch (err) {
      console.error("Failed to submit FAQ:", err);
    }
  };

  const onFinishFailed = (errorInfo: unknown) => {
    console.log("Failed:", errorInfo);
  };

  React.useEffect(() => {
    if (data) {
      form.setFieldsValue({
        id: data.id,
        question: data.question,
        answer: data.answer,
      });
    } else {
      form.resetFields();
    }
  }, [data, form]);

  return (
    <Form<FAQRecord>
      form={form}
      name="faqForm"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item name="id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        label="Question"
        name="question"
        rules={[{ required: true, message: "Question required." }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Answer"
        name="answer"
        rules={[{ required: true, message: "Answer required." }]}
      >
        <TextArea rows={4} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormFAQ;
