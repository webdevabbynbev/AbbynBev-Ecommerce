// app/services/cart/cart_presenter.ts
export class CartPresenter {
  private getBaseUrl(request: any) {
    return process.env.APP_URL || `${request.protocol()}://${request.host()}`
  }

  private toFullUrl(baseUrl: string, value: any) {
    if (!value) return null
    const s = String(value)
    if (s.startsWith('http://') || s.startsWith('https://')) return s
    if (s === '/placeholder.png') return s
    if (s.startsWith('/')) return `${baseUrl}${s}`
    return `${baseUrl}/${s}`
  }

  private resolveVariantName(row: any) {
    let variantName = '-'
    if (row.variant) {
      const v = row.variant as any
      variantName = v.name || v.sku || v.code || ''
      if (!variantName && Array.isArray(v.attributes)) {
        const parts = v.attributes
          .map((a: any) => a?.attribute_value || a?.label || a?.value || '')
          .filter(Boolean)
        if (parts.length) variantName = parts.join(' / ')
      }
      if (!variantName) variantName = '-'
    }
    return variantName
  }

  mapCartRow(row: any, request: any) {
    const baseUrl = this.getBaseUrl(request)

    const product = row.product || {}
    const medias = Array.isArray(product.medias) ? product.medias : []

    const id = Number(row.id)
    const quantity = Number(row.qtyCheckout ?? row.qty ?? 0)
    const price = Number(row.price ?? product.price ?? product.realprice ?? product.basePrice ?? 0)

    const productName =
      product.name ||
      product.title ||
      row.product_name ||
      row.productName ||
      product.product_name ||
      '-'

    const media0 = medias[0] || {}
    const rawThumb =
      product.thumbnail ||
      product.thumbnail_url ||
      product.thumbnailUrl ||
      product.image ||
      product.image_url ||
      media0.url ||
      media0.original_url ||
      media0.file_url ||
      media0.path ||
      media0.file_path ||
      media0.filePath ||
      null

    const thumbnail = this.toFullUrl(baseUrl, rawThumb) || '/placeholder.png'
    const variantName = this.resolveVariantName(row)

    const lineAmount = Number(row.amount ?? price * quantity)

    return {
      ...row,

      id,
      cart_id: id,
      cartId: id,

      quantity,
      amount: lineAmount,
      product_name: productName,
      variant_name: variantName,

      product: {
        ...product,
        name: productName,
        price,
        thumbnail,
        variant_name: variantName,
      },

      variant: row.variant ? { ...(row.variant as any), name: variantName } : row.variant,
    }
  }

  presentPaginated(paginatorJson: { meta: any; data: any[] }, request: any) {
    const items = (paginatorJson.data || []).map((row: any) => this.mapCartRow(row, request))
    const subtotal = items.reduce((acc: number, item: any) => acc + Number(item.amount ?? 0), 0)
    return { items, subtotal, meta: paginatorJson.meta }
  }

  presentMini(carts: any[], request: any) {
    const items = (carts || []).map((row: any) => this.mapCartRow(row, request))
    const subtotal = items.reduce((acc: number, item: any) => acc + Number(item.amount ?? 0), 0)
    return { items, subtotal }
  }
}
