import React from "react";
import { Form, Select, Input, Row, Col } from "antd";
import helper from "../../../utils/helper";

export type DiscountType = {
  type?: number | null;
  value?: string | number | null;
  max_value?: string | number | null;
  start_date?: string | null;
  end_date?: string | null;
};

type FormDiscountProps = {
  discount: DiscountType;
  setDiscount: React.Dispatch<React.SetStateAction<DiscountType>>;
};

const FormDiscount: React.FC<FormDiscountProps> = ({ setDiscount, discount }) => {
  return (
    <>
      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
        Discount
      </div>

      {}
      <Form.Item label="Type">
        <Select<number>
          value={discount?.type ?? null}
          placeholder="Select type"
          onChange={(value) => {
            setDiscount({
              ...discount,
              type: value,
            });
          }}
        >
          <Select.Option value={1}>Percentage</Select.Option>
          <Select.Option value={2}>Amount</Select.Option>
        </Select>
      </Form.Item>

      {}
      {discount?.type === 1 ? (
        <Row gutter={[12, 12]}>
          {}
          <Col xs={24} sm={24} md={24} lg={6}>
            <Form.Item label="Disc (%)">
              <Input
                value={discount?.value ?? ""}
                type="number"
                suffix="%"
                min={0}
                onChange={(e) => {
                  let val = Number(e.target.value);
                  if (val < 0) val = 0;

                  setDiscount({
                    ...discount,
                    value: val,
                  });
                }}
              />
            </Form.Item>
          </Col>

          {}
          <Col xs={24} sm={24} md={24} lg={18}>
            <Form.Item label="Max disc price">
              <Input
                value={helper.formatRupiah(discount?.max_value || "")}
                prefix="Rp"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const formatted = helper.formatRupiah(val);
                    setDiscount({
                      ...discount,
                      max_value: formatted,
                    });
                  } else {
                    setDiscount({
                      ...discount,
                      max_value: "",
                    });
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      ) : (
        <Form.Item label="Price">
          <Input
            value={helper.formatRupiah(discount?.value || "")}
            prefix="Rp"
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const formatted = helper.formatRupiah(val);
                setDiscount({
                  ...discount,
                  value: formatted,
                });
              } else {
                setDiscount({
                  ...discount,
                  value: "",
                });
              }
            }}
          />
        </Form.Item>
      )}

      {}
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={24} md={24} lg={12}>
          <Form.Item label="Start Date">
            <Input
              value={discount?.start_date ?? ""}
              type="datetime-local"
              onChange={(e) =>
                setDiscount({
                  ...discount,
                  start_date: e.target.value,
                })
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={24} md={24} lg={12}>
          <Form.Item label="End Date">
            <Input
              type="datetime-local"
              value={discount?.end_date ?? ""}
              onChange={(e) =>
                setDiscount({
                  ...discount,
                  end_date: e.target.value,
                })
              }
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default FormDiscount;
