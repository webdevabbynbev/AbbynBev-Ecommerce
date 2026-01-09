import React from "react";
import { Form, Input, InputNumber, Button, Select, message } from "antd";
import type { FormProps } from "antd";
import http from "../../../api/http";

export type ConcernOptionRecord = {
  id: number;
  slug: string;
  concernId: number;
  name: string;
  description?: string | null;
  position?: number | null;
};

type FormConcernOptionProps = {
  data?: ConcernOptionRecord | false;
  handleClose: () => void;
  concernId?: number;
};

type OptionPayload = {
  concernId?: number;
  name: string;
  description?: string;
  position?: number | null;
};

const FormConcernOption: React.FC<FormConcernOptionProps> = ({
  data,
  handleClose,
  concernId,
}) => {
  const [form] = Form.useForm<OptionPayload>();
  const [concernChoices, setConcernChoices] = React.useState<{ value: number; label: string }[]>(
    []
  );

  React.useEffect(() => {
    (async () => {
      if (concernId) return;
      try {
        const resp = await http.get("/admin/concern?page=1&per_page=9999");
        const list = resp?.data?.serve?.data ?? [];
        setConcernChoices(
          list.map((c: any) => ({
            value: c.id,
            label: c.name,
          }))
        );
      } catch {
        message.error("Failed to load concern choices");
      }
    })();
  }, [concernId]);

  React.useEffect(() => {
    form.resetFields();
    if (data) {
      form.setFieldsValue({
        concernId: data.concernId ?? concernId,
        name: data.name,
        description: data.description ?? "",
        position: data.position ?? undefined,
      });
    } else {
      form.setFieldsValue({ concernId, name: "", description: "", position: undefined });
    }
  }, [data, concernId]);

  const onFinish: FormProps<OptionPayload>["onFinish"] = async (values) => {
    try {
      const payload: OptionPayload = {
        ...values,
        concernId: values.concernId ?? concernId,
      };

      if (!payload.concernId) {
        message.error("Concern is required");
        return;
      }

      if (data) {
        await http.put(`/admin/concern-options/${(data as ConcernOptionRecord).slug}`, payload);
        message.success("Concern option updated");
      } else {
        await http.post("/admin/concern-options", payload);
        message.success("Concern option created");
      }
      form.resetFields();
      handleClose();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to submit");
    }
  };

  return (
    <Form layout="vertical" form={form} onFinish={onFinish}>
      {!concernId && (
        <Form.Item
          label="Concern"
          name="concernId"
          rules={[{ required: true, message: "Concern is required" }]}
        >
          <Select
            placeholder="Select concern"
            options={concernChoices}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      )}

      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Name is required" }]}
      >
        <Input placeholder="Option name" />
      </Form.Item>

      <Form.Item label="Description" name="description">
        <Input.TextArea placeholder="Description (optional)" rows={4} />
      </Form.Item>

      <Form.Item label="Position" name="position">
        <InputNumber placeholder="Position (optional)" style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block shape="round">
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormConcernOption;
