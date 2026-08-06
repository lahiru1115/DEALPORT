/**
 * The API's enums, restated for the client.
 *
 * These mirror `apps/api/prisma/schema.prisma` exactly. They are declared as
 * const objects with a matching union type rather than TypeScript `enum`s:
 * Prisma generates its own enums on the server, and two nominal `enum` types
 * with the same members are still incompatible with each other. A string union
 * is structurally identical to what Prisma produces, so values cross the
 * boundary without casts in either direction.
 */

export const Role = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** "Publish Product" vs "Save to draft" on the Add Product screen. */
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

/** Drives the status pills in the dashboard's Transaction table. */
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
