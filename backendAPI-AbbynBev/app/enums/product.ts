export enum StatusProduct {
  DRAFT = 0,
  NORMAL = 1,
  WAR = 2,
}

export const StatusProductLabel: Record<StatusProduct, string> = {
  [StatusProduct.DRAFT]: 'draft',
  [StatusProduct.NORMAL]: 'normal',
  [StatusProduct.WAR]: 'war',
}
