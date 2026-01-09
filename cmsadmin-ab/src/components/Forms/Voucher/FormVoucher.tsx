import React, { useEffect, useState } from "react";
import { Form, Input, Button, Select, Radio } from "antd";
import moment from "moment";
import http from "../../../api/http";
import helper from "../../../utils/helper";

type VoucherFormValues = {
  id?: number | string;
  name: string;
  code: string;
  type: number | null;
  price?: string;
  expired_at: string;
  started_at: string;
  max_disc_price?: string;
  percentage?: string;
  is_percentage: number;
  is_active: number;
  qty: number;
};

type FormVoucherProps = {
  data?: {
    id?: number | string;
    name?: string;
    code?: string;
    type?: number;
    price?: number;
    expiredAt?: string;
    startedAt?: string;
    maxDiscPrice?: number;
    percentage?: number;
    isPercentage?: number;
    isActive?: number;
    qty?: number;
  };
  handleClose: () => void;
};

const FormVoucher: React.FC<FormVoucherProps> = ({ data, handleClose }) => {
  const [typeDisc, setTypeDisc] = useState<number>(data?.isPercentage ?? 1);
  const [form] = Form.useForm<VoucherFormValues>();

  const onFinish = async (values: VoucherFormValues) => {
    try {
      if (values.is_percentage === 1) {
        values.max_disc_price = values.max_disc_price?.replace(/\./g, "");
      } else {
        values.price = values.price?.replace(/\./g, "");
      }

      if (data) {
        await http.put("/admin/voucher", values);
      } else {
        await http.post("/admin/voucher", values);
      }

      form.resetFields();
      handleClose();
    } catch (err) {
      console.error("Failed to submit voucher form:", err);
    }
  };

  const onFinishFailed = (errorInfo: unknown) => {
    console.error("Form submission failed:", errorInfo);
  };

  const init: VoucherFormValues = {
    id: data?.id ?? "",
    name: data?.name ?? "",
    code: data?.code ?? "",
    type: data?.type ?? null,
    price: data?.price ? helper.formatRupiah(data.price) : "",
    expired_at: data?.expiredAt
      ? moment(data.expiredAt).utc().format("YYYY-MM-DD HH:mm:ss")
      : "",
    started_at: data?.startedAt
      ? moment(data.startedAt).utc().format("YYYY-MM-DD HH:mm:ss")
      : "",
    max_disc_price: data?.maxDiscPrice
      ? helper.formatRupiah(data.maxDiscPrice)
      : "",
    percentage: data?.percentage ? String(data.percentage) : "",
    is_percentage: data?.isPercentage ?? 1,
    is_active: data?.isActive ?? 1,
    qty: data?.qty ?? 0,
  };

  useEffect(() => {
    form.setFieldsValue(init);
    setTypeDisc(init.is_percentage);
  }, [data]);

  return (
    <Form<VoucherFormValues>
      autoComplete="off"
      initialValues={init}
      form={form}
      name="formVoucher"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item label="ID" name="id" hidden>
        <Input hidden />
      </Form.Item>

      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Name required" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Code"
        name="code"
        rules={[{ required: true, message: "Code required" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Is the discount a percentage?" name="is_percentage">
        <Radio.Group
          buttonStyle="solid"
          onChange={(e) => setTypeDisc(e.target.value)}
        >
          <Radio.Button value={1}>Yes</Radio.Button>
          <Radio.Button value={2}>No</Radio.Button>
        </Radio.Group>
      </Form.Item>

      {typeDisc === 1 ? (
        <>
          <Form.Item
            label="Disc (%)"
            name="percentage"
            rules={[{ required: true, message: "Percentage required" }]}
          >
            <Input type="number" suffix="%" />
          </Form.Item>

          <Form.Item
            label="Max disc price"
            name="max_disc_price"
            rules={[{ required: true, message: "Max disc price required" }]}
          >
            <Input
              prefix="Rp"
              onChange={(e) => {
                const value = e.target.value;
                form.setFieldValue(
                  "max_disc_price",
                  value ? helper.formatRupiah(value) : ""
                );
              }}
            />
          </Form.Item>
        </>
      ) : (
        <Form.Item
          label="Price"
          name="price"
          rules={[{ required: true, message: "Price required" }]}
        >
          <Input
            prefix="Rp"
            onChange={(e) => {
              const value = e.target.value;
              form.setFieldValue("price", value ? helper.formatRupiah(value) : "");
            }}
          />
        </Form.Item>
      )}

      <Form.Item
        label="Type"
        name="type"
        rules={[{ required: true, message: "Type required" }]}
      >
        <Select
          options={[
            { value: 1, label: "AMOUNT" },
            { value: 2, label: "SHIPPING" },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Start Date"
        name="started_at"
        rules={[{ required: true, message: "Start Date required" }]}
      >
        <Input type="datetime-local" />
      </Form.Item>

      <Form.Item
        label="Expired Date"
        name="expired_at"
        rules={[{ required: true, message: "Expired Date required" }]}
      >
        <Input type="datetime-local" />
      </Form.Item>

      <Form.Item
        label="Qty"
        name="qty"
        rules={[{ required: true, message: "Qty required" }]}
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item label="Status" name="is_active">
        <Radio.Group buttonStyle="solid">
          <Radio.Button value={1}>Active</Radio.Button>
          <Radio.Button value={2}>Inactive</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" shape="round" block>
          Save & Close
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormVoucher;
