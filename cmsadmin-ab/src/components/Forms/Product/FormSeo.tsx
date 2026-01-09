import React from "react";
import { Form, Radio, Input } from "antd";
import type { FormInstance } from "antd";

type FormSeoProps = {
  form: FormInstance;
};

const FormSeo: React.FC<FormSeoProps> = ({ form }) => {
  const metaAi = Form.useWatch<number | undefined>("meta_ai", form);

  return (
    <>
      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
        SEO & AI
      </div>

      {}
      <Form.Item label="Generate META Tags By AI" name="meta_ai">
        <Radio.Group>
          <Radio value={1}>Yes</Radio>
          <Radio value={2}>No</Radio>
        </Radio.Group>
      </Form.Item>

      {}
      {metaAi === 2 && (
        <>
          <Form.Item
            label="Meta Title"
            name="meta_title"
            rules={[{ required: true, message: "Meta title required." }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Meta Description"
            name="meta_description"
            rules={[{ required: true, message: "Meta description required." }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Meta Keywords"
            name="meta_keywords"
            rules={[{ required: true, message: "Meta keywords required." }]}
          >
            <Input />
          </Form.Item>
        </>
      )}
    </>
  );
};

export default FormSeo;
