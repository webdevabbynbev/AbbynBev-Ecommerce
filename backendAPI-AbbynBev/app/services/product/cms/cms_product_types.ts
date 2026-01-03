export type VariantPayload = {
  id?: number
  barcode: string
  price: number | string
  stock: number
  combination?: number[]
}

export type MediaPayload = {
  url: string
  type: number | string
}

export type DiscountPayload = {
  type: number | string
  value: number | string
  max_value?: number | string
  start_date?: any
  end_date?: any
}

export type CmsProductUpsertPayload = {
  name: string
  description?: string
  weight?: number
  base_price: number
  status?: 'normal' | 'war' | 'draft'
  is_flashsale?: boolean
  category_type_id?: number
  brand_id?: number
  persona_id?: number
  master_sku?: string

  meta_ai?: 0 | 1
  meta_title?: string
  meta_description?: string
  meta_keywords?: string

  tag_ids?: number[]
  concern_option_ids?: number[]
  profile_category_option_ids?: number[]

  medias?: MediaPayload[]
  discounts?: DiscountPayload[]
  variants?: VariantPayload[]
}

export type UpsertVariantsOptions = {
  isUpdate?: boolean
}
