
export const Role = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ProductStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const StockStatus = {
  IN_STOCK: "IN_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  LOW_STOCK: "LOW_STOCK",
} as const;
export type StockStatus = (typeof StockStatus)[keyof typeof StockStatus];

export const OrderStatus = {
  PAID: "PAID",
  PENDING: "PENDING",
  CANCELED: "CANCELED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  CC: "CC",
  PAYPAL: "PAYPAL",
  BANK_TRANSFER: "BANK_TRANSFER",
  COD: "COD",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PRODUCT_STATUSES = Object.values(ProductStatus);
export const STOCK_STATUSES = Object.values(StockStatus);
