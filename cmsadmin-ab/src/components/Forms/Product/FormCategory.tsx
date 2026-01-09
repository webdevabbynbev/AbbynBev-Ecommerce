import React from "react";
import { Form, Select } from "antd";
import http from "../../../api/http";

type TagType = { id: number | string; name: string };
type BrandType = { id: number | string; name: string };
type PersonaType = { id: number | string; name: string };
type ConcernOptionType = { id: number | string; name: string };
type ProfileCategoryOptionType = { id: number | string; label: string };

const fetchAllPages = async <T,>(path: string, perPage = 100): Promise<T[]> => {
  let page = 1;
  const out: T[] = [];

  for (let guard = 0; guard < 500; guard++) {
    const url =
      path.includes("?")
        ? `${path}&page=${page}&per_page=${perPage}`
        : `${path}?page=${page}&per_page=${perPage}`;

    const res = await http.get(url);
    const d = res?.data;
    const serve = d?.serve;
    const items: T[] =
      Array.isArray(serve?.data) ? (serve.data as T[]) :
      Array.isArray(serve)      ? (serve as T[]) :
      Array.isArray(d?.data)    ? (d.data as T[]) :
      Array.isArray(d)          ? (d as T[]) :
      [];

    out.push(...items);
    const total  = Number(serve?.total ?? d?.total ?? NaN);
    const per    = Number(serve?.perPage ?? d?.perPage ?? perPage);
    const lastPageByCount = items.length < per;
    const doneByTotal     = Number.isFinite(total) && out.length >= total;

    if (lastPageByCount || doneByTotal) break;

    page += 1;
  }

  return out;
};


const FormCategory: React.FC = () => {
  const [tags, setTags] = React.useState<TagType[]>([]);
  const [brands, setBrands] = React.useState<BrandType[]>([]);
  const [personas, setPersonas] = React.useState<PersonaType[]>([]);
  const [concernOptions, setConcernOptions] = React.useState<ConcernOptionType[]>([]);
  const [profileCategoryOptions, setProfileCategoryOptions] = React.useState<ProfileCategoryOptionType[]>([]);
  const [loadingOptions, setLoadingOptions] = React.useState<boolean>(false);

  React.useEffect(() => {
    (async () => {
      try {
        setLoadingOptions(true);
        const [
        tagsAll,
        brandsAll,
        personasAll,
        concernsAll,
        profileOptsAll,
        ] = await Promise.all([
          fetchAllPages<TagType>("/admin/tags"),
          fetchAllPages<BrandType>("/admin/brands"),
          fetchAllPages<PersonaType>("/admin/personas"),
          fetchAllPages<ConcernOptionType>("/admin/concern-options"),
          fetchAllPages<ProfileCategoryOptionType>("/admin/profile-category-options"),
        ]);

        setTags(tagsAll);
        setBrands(brandsAll);
        setPersonas(personasAll);
        setConcernOptions(concernsAll);
        setProfileCategoryOptions(profileOptsAll);
      } catch (e) {
        setTags([]);
        setBrands([]);
        setPersonas([]);
        setConcernOptions([]);
        setProfileCategoryOptions([]);
        console.error("Load category options failed:", e);
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, []);

  return (
    <>
      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 10 }}>
        Organization
      </div>

      {}
      <Form.Item
        label="Status"
        name="status"
        rules={[{ required: true, message: "Status required." }]}
      >
        <Select placeholder="Select status">
          <Select.Option value={1}>War Product</Select.Option>
          <Select.Option value={2}>Normal Product</Select.Option>
          <Select.Option value={3}>Draft</Select.Option>
        </Select>
      </Form.Item>

      {}
      <Form.Item
        label="Flashsale"
        name="is_flashsale"
        rules={[{ required: true, message: "Flashsale required." }]}
      >
        <Select placeholder="Select Flashsale">
          <Select.Option value={true}>Ya</Select.Option>
          <Select.Option value={false}>Tidak</Select.Option>
        </Select>
      </Form.Item>

      {}
      <Form.Item
        label="Tag"
        name="tag_id"
        rules={[{ required: true, message: "Tag required." }]}
      >
        <Select
          placeholder="Please select tag"
          loading={loadingOptions}
          showSearch
          optionFilterProp="children"
          virtual
        >
          {tags.map((tag) => (
            <Select.Option key={String(tag.id)} value={tag.id}>
              {tag.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {}
      <Form.Item
        label="Brand"
        name="brand_id"
        rules={[{ required: true, message: "Brand required." }]}
      >
        <Select
          placeholder="Please select Brand"
          loading={loadingOptions}
          showSearch
          optionFilterProp="children"
          virtual
        >
          {brands.map((brand) => (
            <Select.Option key={String(brand.id)} value={brand.id}>
              {brand.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {}
      <Form.Item
        label="Persona"
        name="persona_id"
        rules={[{ required: true, message: "Personas required." }]}
      >
        <Select
          placeholder="Please select Persona"
          loading={loadingOptions}
          showSearch
          optionFilterProp="children"
          virtual
        >
          {personas.map((persona) => (
            <Select.Option key={String(persona.id)} value={persona.id}>
              {persona.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {}
      <Form.Item
        label="Concern Options"
        name="concern_option_ids"
        rules={[{ required: true, message: "Concern Option required." }]}
      >
        <Select
          mode="multiple"
          placeholder="Please select Concern Option"
          loading={loadingOptions}
          showSearch
          optionFilterProp="children"
          virtual
        >
          {concernOptions.map((c) => (
            <Select.Option key={String(c.id)} value={c.id}>
              {c.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {}
      <Form.Item
        label="Profile Category Options"
        name="profile_category_option_ids"
        rules={[{ required: true, message: "Profile Category Option required." }]}
      >
        <Select
          mode="multiple"
          placeholder="Please select Profile Category Option"
          loading={loadingOptions}
          showSearch
          optionFilterProp="children"
          virtual
        >
          {profileCategoryOptions.map((p) => (
            <Select.Option key={String(p.id)} value={p.id}>
              {p.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
};

export default FormCategory;
