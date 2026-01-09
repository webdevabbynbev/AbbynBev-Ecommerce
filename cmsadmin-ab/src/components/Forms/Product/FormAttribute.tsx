import React from "react";
import Button from "antd/es/button";
import Input from "antd/es/input";
import Row from "antd/es/row";
import Col from "antd/es/col";
import Table from "antd/es/table";
import Select from "antd/es/select";
import InputNumber from "antd/es/input-number";
import Divider from "antd/es/divider";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import http from "../../../api/http";
import helper from "../../../utils/helper";

const { Option } = Select;

type AttrValueOption = { value: number; label: string };

export type AttributeRow = {
  attribute_id: number | null;
  values: AttrValueOption[];
};

type AllAttribute = {
  value: number;
  label: string;
  options: AttrValueOption[];
};

export type CombinationRow = {
  key: number;
  combination: Array<number | string>;
  display: string[];
  price: string;
  stock: number | null;
  barcode: string;
};

type Props = {
  attributes: AttributeRow[];
  setAttributes: React.Dispatch<React.SetStateAction<AttributeRow[]>>;
  combinations: CombinationRow[];
  setCombinations: React.Dispatch<React.SetStateAction<CombinationRow[]>>;
};

const FormAttribute: React.FC<Props> = ({
  attributes,
  setAttributes,
  combinations,
  setCombinations,
}) => {
  const [attrName, setAttrName] = React.useState<string>("");
  const [attrValue, setAttrValue] = React.useState<string>("");
  const [allAttributes, setAllAttributes] = React.useState<AllAttribute[]>([]);

  React.useEffect(() => {
    fetchAttributeName();
  }, []);

  const fetchAttributeName = async () => {
    const res = await http.get("/admin/attribute/list");
    const serve: any[] = res?.data?.serve ?? [];
    if (Array.isArray(serve) && serve.length > 0) {
      const formatted: AllAttribute[] = serve.map((attr: any) => ({
        value: Number(attr.id),
        label: String(attr.name),
        options: Array.isArray(attr.values)
          ? attr.values.map((v: any) => ({
              value: Number(v.id),
              label: String(v.value),
            }))
          : [],
      }));
      setAllAttributes(formatted);
    } else {
      setAllAttributes([]);
    }
  };

  const handleAddAttribute = () => {
    setAttributes((prev) => [...prev, { attribute_id: null, values: [] }]);
  };

  const handleAttributeChange = <
    K extends keyof AttributeRow,
    V extends AttributeRow[K]
  >(
    index: number,
    key: K,
    value: V
  ) => {
    setAttributes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const generateCombinations = () => {
    const valuesList: number[][] = attributes.map((attr) =>
      (attr.values ?? []).map((v) => Number(v.value))
    );

    const combos = cartesianProduct(valuesList);

    const next: CombinationRow[] = combos.map((combo, idx) => {
      const exists = combinations.find(
        (c) => JSON.stringify(c.combination) === JSON.stringify(combo)
      );
      const display = combo.map((id, i) => {
        const a = attributes[i];
        const found = a?.values?.find((v) => Number(v.value) === Number(id));
        return found ? found.label : String(id);
      });

      return {
        key: idx,
        combination: combo,
        display,
        price: exists ? exists.price : "",
        stock: exists ? exists.stock : null,
        barcode: exists ? exists.barcode : "",
      };
    });

    setCombinations(next);
  };

  const handleCombinationChange = (
    key: number,
    field: keyof CombinationRow,
    value: CombinationRow[typeof field]
  ) => {
    setCombinations((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c) => c.key === key);
      if (idx >= 0) {
        next[idx] = { ...next[idx], [field]: value } as CombinationRow;
      }
      return next;
    });
  };

  return (
    <>
      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
        Variants
      </div>

      {attributes.map((attribute, index) => (
        <Row gutter={[12, 12]} key={index} style={{ marginBottom: 10 }}>
          {}
          <Col xs={12} md={12} sm={12} lg={11}>
            <Select<number>
              style={{ width: "100%" }}
              placeholder="Select Attribute"
              value={attribute.attribute_id ?? undefined}
              onChange={(val) => handleAttributeChange(index, "attribute_id", val)}
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: "4px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      padding: 8,
                      gap: 10,
                    }}
                  >
                    <Input
                      style={{ flex: "auto" }}
                      value={attrName}
                      placeholder="Enter variant name..."
                      onChange={(e) => setAttrName(e.target.value)}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      type="primary"
                      onClick={async () => {
                        if (!attrName.trim()) return;
                        const res = await http.post("/admin/attribute", {
                          name: attrName,
                        });
                        if (res) {
                          await fetchAttributeName();
                          setAttrName("");
                        }
                      }}
                    >
                      Create New
                    </Button>
                  </div>
                </div>
              )}
            >
              {allAttributes.map((attr) => (
                <Option key={attr.value} value={attr.value}>
                  {attr.label}
                </Option>
              ))}
            </Select>
          </Col>

          {}
          <Col xs={12} md={12} sm={12} lg={11}>
            <Select<AttrValueOption[]>
              mode="multiple"
              labelInValue
              placeholder="Enter or Select Values"
              style={{ width: "100%" }}
              value={attribute.values}
              onChange={(vals) => handleAttributeChange(index, "values", vals)}
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: "4px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      padding: 8,
                      gap: 10,
                    }}
                  >
                    <Input
                      style={{ flex: "auto" }}
                      value={attrValue}
                      placeholder="Enter variant value..."
                      onChange={(e) => setAttrValue(e.target.value)}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      type="primary"
                      onClick={async () => {
                        if (!attribute.attribute_id || !attrValue.trim()) return;
                        const res = await http.post(
                          `/admin/attribute/list-value/${attribute.attribute_id}`,
                          { value: attrValue }
                        );
                        if (res) {
                          await fetchAttributeName();
                          setAttrValue("");
                        }
                      }}
                    >
                      Create New
                    </Button>
                  </div>
                </div>
              )}
            >
              {allAttributes
                .find((attr) => attr.value === attribute.attribute_id)
                ?.options.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
            </Select>
          </Col>

          {}
          <Col xs={12} md={12} sm={12} lg={2}>
            <Button
              icon={<DeleteOutlined />}
              type="text"
              danger
              onClick={() =>
                setAttributes((prevAttr) =>
                  prevAttr.filter((_, key) => key !== index)
                )
              }
            />
          </Col>
        </Row>
      ))}

      {}
      <div style={{ display: "flex", marginBottom: 10, alignItems: "center" }}>
        <Button type="dashed" onClick={handleAddAttribute} icon={<PlusOutlined />}>
          Add Attribute
        </Button>
        <Button
          type="primary"
          style={{ marginLeft: 8 }}
          onClick={generateCombinations}
          disabled={attributes.length === 0}
        >
          Generate Combinations
        </Button>
      </div>

      {}
      {combinations.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Table<CombinationRow>
            rowKey={(r) => String(r.key)}
            dataSource={combinations}
            pagination={false}
            columns={[
              {
                title: "Combination",
                dataIndex: "display",
                key: "display",
                render: (combo: CombinationRow["display"]) => combo.join(" - "),
              },
              {
                title: "Price",
                dataIndex: "price",
                key: "price",
                render: (_: unknown, record) => (
                  <Input
                    prefix="Rp"
                    value={helper.formatRupiah(record.price || "")}
                    onChange={(e) => {
                      const val = e.target.value ?? "";
                      if (val) {
                        const rupiahFormat = helper.formatRupiah(val);
                        handleCombinationChange(record.key, "price", rupiahFormat);
                      } else {
                        handleCombinationChange(record.key, "price", "");
                      }
                    }}
                  />
                ),
              },
              {
                title: "Stock",
                dataIndex: "stock",
                key: "stock",
                render: (_: unknown, record) => (
                  <InputNumber
                    min={0}
                    value={record.stock ?? 0}
                    onChange={(value) =>
                      handleCombinationChange(
                        record.key,
                        "stock",
                        typeof value === "number" ? value : 0
                      )
                    }
                  />
                ),
              },
              {
                title: "Barcode SKU",
                dataIndex: "barcode",
                key: "barcode",
                render: (_: unknown, record) => (
                  <Input
                    value={record.barcode}
                    onChange={(e) =>
                      handleCombinationChange(record.key, "barcode", e.target.value)
                    }
                  />
                ),
              },
            ]}
          />
        </div>
      )}
    </>
  );
};

const cartesianProduct = (arrays: number[][]): number[][] => {
  if (arrays.length === 0) return [];
  return arrays.reduce<number[][]>(
    (a, b) => a.flatMap((d) => b.map((e) => [...(Array.isArray(d) ? d : [d]), e])),
    [[]]
  );
};

export default FormAttribute;
