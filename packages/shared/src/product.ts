import { z } from "zod";

import { ProductStatus, StockStatus } from "./enums";

export type MoneyString = string;

export type IsoDateString = string;

export interface ProductImage {
  id: string;
  url: string;
  publicId: string | null;
  position: number;
  isPrimary: boolean;
  productId: string;
  createdAt: IsoDateString;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;

  price: MoneyString;
  discountedPrice: MoneyString | null;
  taxIncluded: boolean;
  currency: string;

  saleStartsAt: IsoDateString | null;
  saleEndsAt: IsoDateString | null;

  stockQuantity: number | null;
  unlimitedStock: boolean;
  stockStatus: StockStatus;

  status: ProductStatus;
  featured: boolean;

  colors: string[];
  totalOrders: number;

  categoryId: string | null;
  createdById: string | null;

  category: ProductCategory | null;
  tags: ProductTag[];
  images: ProductImage[];

  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface WidgetProduct {
  id: string;
  name: string;
  sku: string;
  price: MoneyString;
  totalOrders: number;
  stockStatus: StockStatus;
  images: ProductImage[];
}

export const PRODUCT_SORT_FIELDS = [
  "createdAt",
  "name",
  "price",
  "totalOrders",
] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export type SortOrder = "asc" | "desc";

export interface ProductQuery {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  stockStatus?: StockStatus;
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: ProductSortField;
  sortOrder?: SortOrder;
}

const toNumeric = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const hasAtMostTwoDecimals = (value: number) =>
  /^-?\d+(\.\d{1,2})?$/.test(String(value));

const priceField = z
  .preprocess(toNumeric, z.union([z.number(), z.string()]).optional())
  .superRefine((value, ctx) => {
    if (value === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Product price is required" });
      return;
    }
    if (typeof value === "string") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid price" });
      return;
    }
    if (value < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price cannot be negative" });
      return;
    }
    if (!hasAtMostTwoDecimals(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use at most 2 decimal places" });
    }
  });

const optionalPriceField = z.preprocess(
  toNumeric,
  z
    .number({ invalid_type_error: "Enter a valid price" })
    .min(0, "Price cannot be negative")
    .refine(hasAtMostTwoDecimals, "Use at most 2 decimal places")
    .optional(),
);

const optionalQuantityField = z.preprocess(
  toNumeric,
  z
    .number({ invalid_type_error: "Enter a whole number" })
    .int("Enter a whole number")
    .min(0, "Quantity cannot be negative")
    .optional(),
);

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid colour");

const isoDateField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date")
    .optional(),
);

export const productImageSchema = z.object({
  url: z.string().url("Image URL is invalid"),
  publicId: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export type ProductImageInput = z.infer<typeof productImageSchema>;

const productBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(160, "Product name must be 160 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5000 characters or fewer")
    .optional(),

  price: priceField,
  discountedPrice: optionalPriceField,
  taxIncluded: z.boolean().default(true),
  currency: z.string().default("USD"),

  saleStartsAt: isoDateField,
  saleEndsAt: isoDateField,

  stockQuantity: optionalQuantityField,
  unlimitedStock: z.boolean().default(false),
  stockStatus: z.nativeEnum(StockStatus).default(StockStatus.IN_STOCK),

  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  featured: z.boolean().default(false),

  colors: z.array(hexColor).default([]),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  images: z.array(productImageSchema).default([]),
});

type ProductFields = Partial<z.infer<typeof productBaseSchema>>;

const addPriceAndSaleWindowIssues = (data: ProductFields, ctx: z.RefinementCtx) => {
  if (
    data.discountedPrice !== undefined &&
    typeof data.price === "number" &&
    data.discountedPrice >= data.price
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountedPrice"],
      message: "Discounted price must be less than the price",
    });
  }

  if (
    data.saleStartsAt &&
    data.saleEndsAt &&
    Date.parse(data.saleEndsAt) <= Date.parse(data.saleStartsAt)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["saleEndsAt"],
      message: "End date must be after the start date",
    });
  }
};

export const createProductSchema = productBaseSchema
  .superRefine((data, ctx) => {
    addPriceAndSaleWindowIssues(data, ctx);

    if (!data.unlimitedStock && data.stockQuantity === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stockQuantity"],
        message: "Stock quantity is required unless stock is unlimited",
      });
    }
  })
  .transform((data) => ({ ...data, price: data.price as number }));

export const updateProductSchema = productBaseSchema
  .partial()
  .superRefine(addPriceAndSaleWindowIssues)
  .transform(({ price, ...rest }) =>
    price === undefined ? rest : { ...rest, price: price as number },
  );

export type CreateProductInput = z.input<typeof createProductSchema>;
export type CreateProductPayload = z.output<typeof createProductSchema>;

export type UpdateProductInput = z.input<typeof updateProductSchema>;
export type UpdateProductPayload = z.output<typeof updateProductSchema>;
